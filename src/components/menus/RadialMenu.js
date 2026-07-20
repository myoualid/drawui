import { Container, StackPanel, Icon, Span, TextBlock } from "../../primitives/ui.js";

/** @category Overlays */
function normalizeShortcutKeys(shortcutOrKeys) {
	if (shortcutOrKeys == null) {
		return [];
	}

	const values = Array.isArray(shortcutOrKeys) ? shortcutOrKeys : [shortcutOrKeys];
	const normalizedValues = [];

	for (const value of values) {
		if (typeof value !== "string") {
			continue;
		}

		const trimmedValue = value.trim();

		if (!trimmedValue) {
			continue;
		}

		normalizedValues.push(trimmedValue);
	}

	return [...new Set(normalizedValues)];
}

/** @category Overlays */
function createOperatorButton(iconName) {
	const button = new Container();

	button.addClass("Operator");

	const icon = new Icon(iconName);

	button.add(icon);

	return button;
}

/** @category Overlays */
export class RadialMenu {
	static instances = new Set();

	static keyboardListener = null;

	static ensureKeyboardListener() {
		if (typeof document === "undefined" || RadialMenu.keyboardListener) {
			return;
		}

		RadialMenu.keyboardListener = (event) => {
			RadialMenu.handleKeyDown(event);
		};

		document.addEventListener("keydown", RadialMenu.keyboardListener);
	}

	static removeKeyboardListenerIfUnused() {
		if (
			typeof document === "undefined" ||
			!RadialMenu.keyboardListener ||
			RadialMenu.instances.size > 0
		) {
			return;
		}

		document.removeEventListener("keydown", RadialMenu.keyboardListener);
		RadialMenu.keyboardListener = null;
	}

	static handleKeyDown(event) {
		const instances = [...RadialMenu.instances];

		if (event.key === "Escape") {
			let closedAny = false;

			for (const instance of instances) {
				if (instance.isVisible) {
					instance.hide();
					closedAny = true;
				}
			}

			if (closedAny) {
				event.preventDefault();
			}

			return;
		}

		if (instances.length === 0) {
			return;
		}

		const candidateInstances = instances.filter((instance) => {
			return instance.matchesShortcutEvent(event);
		});

		if (candidateInstances.length === 0) {
			return;
		}

		event.preventDefault();

		const targetInstance = RadialMenu.resolveShortcutTarget(candidateInstances);

		if (!targetInstance) {
			return;
		}

		if (targetInstance.isVisible) {
			targetInstance.hide();
			return;
		}

		for (const instance of instances) {
			if (instance !== targetInstance && instance.isVisible) {
				instance.hide();
			}
		}

		targetInstance.show();
	}

	static resolveShortcutTarget(instances) {
		const pointedInstance = instances.find((instance) => instance.hasRecentPointerFocus());

		if (pointedInstance) {
			return pointedInstance;
		}

		const visibleInstance = instances.find((instance) => instance.isVisible);

		if (visibleInstance) {
			return visibleInstance;
		}

		return instances[instances.length - 1] || null;
	}

	constructor(options = {}) {
		const {
			context,
			operators,
			viewport,
			items,
			refreshSignals = [],
			shortcut,
			activationKeys = ["p", "P"],
		} = options;

		this.context = context;
		this.operators = operators;
		this.viewport = viewport || context?.viewport?.dom || null;
		this.refreshSignals = Array.isArray(refreshSignals) ? refreshSignals : [];
		this.activationKeys = new Set();

		this.overlay = null;
		this.surface = null;
		this.dragHandle = null;
		this.itemsHost = null;
		this.hubLabel = null;
		this.hubIcon = null;
		this.itemButtons = [];
		this.selectionCount = 0;
		this.isVisible = false;
		this.lastPointerPosition = null;
		this.lastPointerTimestamp = 0;
		this.items = [];

		if (!this.viewport || typeof document === "undefined") {
			return;
		}

		this.setActivationKeys(shortcut != null ? shortcut : activationKeys);
		RadialMenu.instances.add(this);
		RadialMenu.ensureKeyboardListener();

		this.draw();
		this.bindViewportTriggers();
		this.bindSignals();
		this.setOperators(items);
	}

	normalizeOperatorItem(item, index) {
		if (!item || !item.operator || !item.icon) {
			return null;
		}

		return {
			id: item.id || `pie-menu-item-${index}`,
			name: item.name || item.operator,
			icon: item.icon,
			operator: item.operator,
			isActive: item.isActive,
			active: item.active,
		};
	}

	setOperators(items = []) {
		const nextItems = Array.isArray(items) ? items : [];

		this.items = nextItems
			.map((item, index) => this.normalizeOperatorItem(item, index))
			.filter(Boolean);

		this.renderItems();

		return this;
	}

	addOperator(item, index = this.items.length) {
		const normalized = this.normalizeOperatorItem(item, this.items.length);

		if (!normalized) {
			return this;
		}

		const insertionIndex = Math.max(0, Math.min(index, this.items.length));

		this.items.splice(insertionIndex, 0, normalized);
		this.renderItems();

		return this;
	}

	removeOperator(identifier) {
		const index = this.findOperatorIndex(identifier);

		if (index === -1) {
			return false;
		}

		this.items.splice(index, 1);
		this.renderItems();

		return true;
	}

	clearOperators() {
		this.items = [];
		this.renderItems();

		return this;
	}

	getOperators() {
		return [...this.items];
	}

	setShortcut(shortcutOrKeys) {
		return this.setActivationKeys(shortcutOrKeys);
	}

	setActivationKeys(shortcutOrKeys) {
		this.activationKeys = new Set(normalizeShortcutKeys(shortcutOrKeys));

		return this;
	}

	addActivationKey(shortcutKey) {
		for (const key of normalizeShortcutKeys(shortcutKey)) {
			this.activationKeys.add(key);
		}

		return this;
	}

	removeActivationKey(shortcutKey) {
		for (const key of normalizeShortcutKeys(shortcutKey)) {
			this.activationKeys.delete(key);
		}

		return this;
	}

	getActivationKeys() {
		return [...this.activationKeys];
	}

	getShortcut() {
		const keys = this.getActivationKeys();

		if (keys.length <= 1) {
			return keys[0] || null;
		}

		return keys;
	}

	hasOperator(identifier) {
		return this.findOperatorIndex(identifier) !== -1;
	}

	findOperatorIndex(identifier) {
		if (typeof identifier === "function") {
			return this.items.findIndex(identifier);
		}

		return this.items.findIndex((item) => {
			if (typeof identifier === "string") {
				return item.id === identifier || item.operator === identifier;
			}

			if (identifier && typeof identifier === "object") {
				return item.id === identifier.id || item.operator === identifier.operator;
			}

			return false;
		});
	}

	getLayoutMetrics(itemCount) {
		const count = Math.max(itemCount, 1);
		const itemSize = 56;
		const minGap = 14;
		const outerPadding = 8;
		const hubSize = 76;
		const itemRadius = itemSize / 2;
		const minOrbitRadius = hubSize / 2 + itemRadius + 18;
		const requiredOrbitRadius = Math.ceil((count * (itemSize + minGap)) / (2 * Math.PI));
		const orbitRadius = Math.max(minOrbitRadius, requiredOrbitRadius);
		const surfaceRadius = orbitRadius + itemRadius + outerPadding;
		const diameter = surfaceRadius * 2;

		return {
			count,
			itemSize,
			orbitRadius,
			surfaceRadius,
			diameter,
		};
	}

	draw() {
		if (
			typeof window !== "undefined" &&
			window.getComputedStyle(this.viewport).position === "static"
		) {
			this.viewport.style.position = "relative";
		}

		const overlay = new Container();

		overlay.addClass("RadialMenuOverlay");

		const surface = new Container();

		surface.addClass("RadialMenu");

		const itemsHost = new Container();

		itemsHost.addClass("RadialMenu-items");

		const dragHandle = new Container();

		dragHandle.addClass("RadialMenu-dragHandle");

		const dragIcon = new Icon("drag_indicator");

		dragHandle.add(dragIcon);

		const hub = new StackPanel({ isVertical: true });

		hub.addClass("RadialMenu-hub");

		const hubIcon = new Icon("touch_app");

		const hubLabel = new TextBlock(this.getHubLabel());

		hub.add(hubIcon, hubLabel);

		surface.add(dragHandle, itemsHost, hub);
		overlay.add(surface);

		this.bindDragHandle(dragHandle);

		surface.dom.addEventListener(
			"contextmenu",
			(event) => {
				event.preventDefault();
			},
			true
		);

		this.overlay = overlay;
		this.surface = surface;
		this.dragHandle = dragHandle;
		this.itemsHost = itemsHost;
		this.hubLabel = hubLabel;
		this.hubIcon = hubIcon;
	}

	bindSignals() {
		const signals = this.context?.editor?.signals;

		if (!signals) {
			return;
		}

		signals.selectionChanged.add((count) => {
			this.selectionCount = Number(count) || 0;
			this.updateHubLabel();
			this.refreshItemStates();
		});

		for (const signalName of this.refreshSignals) {
			const signal = signals[signalName];

			if (signal && typeof signal.add === "function") {
				signal.add(() => {
					this.refreshItemStates();
				});
			}
		}
	}

	bindDragHandle(handleEl) {
		const dom = handleEl.dom;

		this.dragPointerId = null;
		this.dragStartClient = null;
		this.dragOriginSurface = null;

		const parsePx = (value, fallback) => {
			const n = Number.parseFloat(value);

			return Number.isFinite(n) ? n : fallback;
		};

		const endDrag = () => {
			const pid = this.dragPointerId;

			this.dragPointerId = null;
			this.dragStartClient = null;
			this.dragOriginSurface = null;

			dom.style.removeProperty("cursor");

			if (pid != null) {
				try {
					dom.releasePointerCapture(pid);
				} catch (_err) {}
			}
		};

		const onPointerMove = (event) => {
			if (
				event.pointerId !== this.dragPointerId ||
				!this.surface?.dom ||
				!this.dragStartClient ||
				!this.dragOriginSurface ||
				!this.isVisible
			) {
				return;
			}

			event.preventDefault();

			const dx = event.clientX - this.dragStartClient.x;
			const dy = event.clientY - this.dragStartClient.y;

			let nextX = this.dragOriginSurface.x + dx;
			let nextY = this.dragOriginSurface.y + dy;

			const viewportRect = this.viewport.getBoundingClientRect();
			const metrics = this.getLayoutMetrics(this.items.length);
			const halfDiameter = metrics.diameter / 2;
			const margin = 12;

			nextX = this.clamp(nextX, halfDiameter + margin, viewportRect.width - halfDiameter - margin);
			nextY = this.clamp(nextY, halfDiameter + margin, viewportRect.height - halfDiameter - margin);

			this.surface.setStyles({
				left: `${nextX}px`,
				top: `${nextY}px`,
			});
		};

		const onPointerUp = (event) => {
			if (event.pointerId !== this.dragPointerId) {
				return;
			}

			endDrag();

			dom.removeEventListener("pointermove", onPointerMove);
			dom.removeEventListener("pointerup", onPointerUp);
			dom.removeEventListener("pointercancel", onPointerUp);
		};

		dom.addEventListener("pointerdown", (event) => {
			if (!this.isVisible || event.button !== 0) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			const left = parsePx(this.surface.dom.style.left, 0);
			const top = parsePx(this.surface.dom.style.top, 0);

			this.dragPointerId = event.pointerId;
			this.dragStartClient = { x: event.clientX, y: event.clientY };
			this.dragOriginSurface = { x: left, y: top };

			dom.style.cursor = "grabbing";

			try {
				dom.setPointerCapture(event.pointerId);
			} catch (_err) {}

			dom.addEventListener("pointermove", onPointerMove);
			dom.addEventListener("pointerup", onPointerUp);
			dom.addEventListener("pointercancel", onPointerUp);
		});
	}

	bindViewportTriggers() {
		this.onPointerMove = (event) => {
			this.lastPointerPosition = this.toViewportPoint(event.clientX, event.clientY);
			this.lastPointerTimestamp = Date.now();
		};

		this.viewport.addEventListener("pointermove", this.onPointerMove);
	}

	matchesShortcutEvent(event) {
		if (!this.viewport || !this.activationKeys.size || event.repeat) {
			return false;
		}

		if (this.isTypingTarget(event.target)) {
			return false;
		}

		return this.activationKeys.has(event.key);
	}

	hasRecentPointerFocus(maxAgeMs = 4000) {
		if (!this.viewport || !this.lastPointerPosition || !this.lastPointerTimestamp) {
			return false;
		}

		return Date.now() - this.lastPointerTimestamp <= maxAgeMs;
	}

	isTypingTarget(target) {
		if (!target || !(target instanceof HTMLElement)) {
			return false;
		}

		if (target.isContentEditable) {
			return true;
		}

		const tagName = target.tagName;

		return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
	}

	toViewportPoint(clientX, clientY) {
		const rect = this.viewport.getBoundingClientRect();

		return {
			x: clientX - rect.left,
			y: clientY - rect.top,
		};
	}

	getViewportCenterPoint() {
		const rect = this.viewport.getBoundingClientRect();

		return {
			x: rect.width / 2,
			y: rect.height / 2,
		};
	}

	clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}

	getHubLabel() {
		if (this.selectionCount > 0) {
			return `${this.selectionCount} selected`;
		}

		return "Selection tools";
	}

	updateHubLabel(text) {
		if (!this.hubLabel) {
			return;
		}

		this.hubLabel.setTextContent(text || this.getHubLabel());
	}

	updateHubIcon(icon) {
		if (!this.hubIcon) {
			return;
		}

		this.hubIcon.setIcon(icon || "touch_app");
	}

	isOperatorReady(item) {
		try {
			return this.operators.canExecute(item.operator, this.context);
		} catch (error) {
			return false;
		}
	}

	isOperatorActive(item) {
		if (typeof item.isActive === "function") {
			return Boolean(
				item.isActive({
					context: this.context,
					operators: this.operators,
					item,
					pieMenu: this,
				})
			);
		}

		return Boolean(item.active);
	}

	refreshItemStates() {
		for (const entry of this.itemButtons) {
			const ready = this.isOperatorReady(entry.item);
			const isActive = this.isOperatorActive(entry.item);

			entry.button.dom.classList.toggle("Disabled", !ready);
			entry.button.dom.classList.toggle("Active", isActive);
			entry.button.dom.setAttribute("aria-disabled", String(!ready));
			entry.button.dom.tabIndex = ready ? 0 : -1;
		}
	}

	buildItems(metrics) {
		this.itemsHost.dom.replaceChildren();
		this.itemButtons = [];

		const angleStep = 360 / metrics.count;
		const startAngle = -90;
		const center = metrics.surfaceRadius;

		this.surface.setStyles({
			width: `${metrics.diameter}px`,
			height: `${metrics.diameter}px`,
		});

		for (let index = 0; index < this.items.length; index++) {
			const item = this.items[index];
			const angle = startAngle + index * angleStep;
			const radians = (angle * Math.PI) / 180;
			const x = center + Math.cos(radians) * metrics.orbitRadius;
			const y = center + Math.sin(radians) * metrics.orbitRadius;
			const slot = new Container();
			const button = createOperatorButton(item.icon);

			slot.addClass("RadialMenu-itemSlot").addClass(`RadialMenu-itemSlot-${index}`);
			slot.setStyles({
				left: `${x}px`,
				top: `${y}px`,
				width: `${metrics.itemSize}px`,
				height: `${metrics.itemSize}px`,
			});

			button.setTooltip(item.name);


			button.dom.addEventListener("pointerenter", () => {
				this.updateHubLabel(item.name);
				this.updateHubIcon(item.icon);
			});

			button.dom.addEventListener("pointerleave", () => {
				this.updateHubLabel();
				this.updateHubIcon();
			});

			button.onClick(async () => {
				if (!this.isOperatorReady(item)) {
					return;
				}

				await this.operators.execute(item.operator, this.context);
			});

			slot.add(button);
			this.itemsHost.add(slot);
			this.itemButtons.push({ button, slot, item });
		}

		this.refreshItemStates();
	}

	renderItems() {
		if (!this.itemsHost || !this.surface) {
			return;
		}

		if (this.items.length === 0) {
			this.itemsHost.dom.replaceChildren();
			this.itemButtons = [];
			return;
		}

		this.buildItems(this.getLayoutMetrics(this.items.length));
	}

	show() {
		const point = this.lastPointerPosition || this.getViewportCenterPoint();

		this.showAt(point.x, point.y);
	}

	showAt(x, y) {
		if (!this.overlay || !this.surface || this.items.length === 0) {
			return;
		}

		if (this.overlay.dom.parentNode !== this.viewport) {
			this.viewport.appendChild(this.overlay.dom);
		}

		const viewportRect = this.viewport.getBoundingClientRect();
		const metrics = this.getLayoutMetrics(this.items.length);
		const halfDiameter = metrics.diameter / 2;
		const margin = 12;
		const clampedX = this.clamp(x, halfDiameter + margin, viewportRect.width - halfDiameter - margin);
		const clampedY = this.clamp(y, halfDiameter + margin, viewportRect.height - halfDiameter - margin);

		this.buildItems(metrics);

		this.surface.setStyles({
			left: `${clampedX}px`,
			top: `${clampedY}px`,
		});

		this.updateHubLabel();
		this.updateHubIcon();
		this.isVisible = true;
	}

	hide() {
		if (!this.overlay) {
			return;
		}

		if (this.overlay.dom.parentNode) {
			this.overlay.dom.parentNode.removeChild(this.overlay.dom);
		}

		this.isVisible = false;
		this.updateHubLabel();
		this.updateHubIcon();
	}

	toggle() {
		if (this.isVisible) {
			this.hide();
			return;
		}

		this.show();
	}

	destroy() {
		if (this.viewport && this.onPointerMove) {
			this.viewport.removeEventListener("pointermove", this.onPointerMove);
		}

		RadialMenu.instances.delete(this);
		RadialMenu.removeKeyboardListenerIfUnused();

		if (this.overlay?.dom?.parentNode) {
			this.overlay.dom.parentNode.removeChild(this.overlay.dom);
		}

		this.overlay = null;
		this.surface = null;
		this.dragHandle = null;
		this.itemsHost = null;
		this.hubLabel = null;
		this.hubIcon = null;
		this.itemButtons = [];
		this.isVisible = false;
	}
}
