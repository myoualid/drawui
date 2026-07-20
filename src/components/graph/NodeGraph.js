import {
    Container,
    StackPanel,
    Button,
    Span,
    Checkbox,
    Icon,
} from "../../primitives/ui.js";

/** @category Peers */
class HierarchyToggleUtil {
    constructor() {
        this.expanded = new Set();
    }

    toggleNode(id) {
        if (this.expanded.has(id)) {
            this.expanded.delete(id);
        } else {
            this.expanded.add(id);
        }
    }

    isExpanded(id) {
        return this.expanded.has(id);
    }

    expandAll(nodes) {
        const nextExpanded = new Set();

        if (!Array.isArray(nodes)) {
            this.expanded = nextExpanded;
            return;
        }

        nodes.forEach((node) => {
            if (!node) {
                return;
            }

            const nodeId = node.id;

            if (nodeId === undefined || nodeId === null) {
                return;
            }

            nextExpanded.add(nodeId);
        });

        this.expanded = nextExpanded;
    }
}

/** @category Peers */
class NodeGraph extends Container {
    constructor(nodeData) {
        super();

        this.embedded = nodeData.embedded || false;
        this.hierarchyToggleUtil = new HierarchyToggleUtil();
        this.hierarchyToggleUtil.expandAll(nodeData.nodes);
        this.moveInPack = false;
        this.highlightByGroup = false;
        this.noOverlapDisplay = false;
        this.onEdit = nodeData.onEdit || null;
        this.onDelete = nodeData.onDelete || null;
        this.onNodeClick = nodeData.onNodeClick || null;
        this.readOnly = nodeData.readOnly === true;
        this.allowConnections = nodeData.allowConnections !== false && this.readOnly === false;

        this.addClass("ws-node-view-root");

        if (this.embedded) {
            this.addClass("ws-node-view-embedded");
        }

        this._buildNodeView(nodeData);
    }

    addNode(nodeData) {
        const canvasInner = this.dom.querySelector(".ws-node-canvas-inner");
        const rect = canvasInner.getBoundingClientRect();
        const mouseX = rect.left + rect.width / 2;
        const mouseY = rect.top + rect.height / 2;
        const nodeElement = this._createNodeElement(nodeData, { x: mouseX, y: mouseY });
        this.currentNodeData.canvasInner.add(nodeElement);
    }

    removeNode(nodeId) {
        const nodeElement = this.dom.querySelector(`.ws-node[data-node-id="${nodeId}"]`);

        if (nodeElement) {
            nodeElement.remove();
        }
    }

    updateNode(nodeId, newData) {
        const nodeElement = this.dom.querySelector(`.ws-node[data-node-id="${nodeId}"]`);

        if (!nodeElement) {
            return;
        }

        Object.entries(newData).forEach(([key, value]) => {
            nodeElement.setAttribute(`data-${key}`, value);
        });
    }

    toggleNodeChildren(nodeId) {
        const wasExpanded = this.hierarchyToggleUtil.isExpanded(nodeId);
        this.hierarchyToggleUtil.toggleNode(nodeId);
        const isNowExpanded = this.hierarchyToggleUtil.isExpanded(nodeId);
        const nodeElement = this.currentNodeData.canvasInner.dom.querySelector(`[data-node-id="${nodeId}"]`);

        if (nodeElement) {
            const rollButton = nodeElement.querySelector(".ws-node-roll-btn");

            if (rollButton) {
                rollButton.textContent = isNowExpanded ? "v" : ">";
                rollButton.title = isNowExpanded ? "Collapse" : "Expand";
            }
        }

        if (isNowExpanded && !wasExpanded) {
            this._repositionChildrenRelativeToParent(nodeId);
        }

        this._updateNodeVisibility();
        this._updateConnectionsVisibility();
        this._updateMiniMap();

        setTimeout(() => {
            this._recalculateAllConnections();

            if (this.highlightByGroup) {
                this._createGroupBackgrounds(this.currentNodeData.nodeData.nodes, this.currentNodeData.canvasInner);
            }
        }, 50);
    }

    highlightNode(nodeId) {
        const nodeElement = this.currentNodeData.canvasInner.dom.querySelector(`[data-node-id="${nodeId}"]`);

        if (nodeElement) {
            nodeElement.classList.add("critical");
        }
    }

    highlightConnection(sourceId, targetId, color) {
        const connectionElement = this.currentNodeData.connectionsLayer.querySelector(`[data-connection-id="${sourceId}-${targetId}"]`);

        if (!connectionElement) {
            return;
        }

        const path = connectionElement.querySelector(".ws-connection-path");

        if (path) {
            path.setAttribute("stroke", color);
            path.setAttribute("stroke-width", "3");
        }
    }

    clearHighlights() {
        const nodes = this.currentNodeData.canvasInner.dom.querySelectorAll(".ws-node");
        nodes.forEach((node) => {
            node.style.borderColor = "";
            node.style.boxShadow = "";
        });

        const connections = this.currentNodeData.connectionsLayer.querySelectorAll(".ws-connection-path");
        connections.forEach((path) => {
            path.setAttribute("stroke", "#0a84ff");
            path.setAttribute("stroke-width", "2");
        });
    }

    addConnection(sourceId, sourceHandle, targetId, targetHandle) {
        const existingConnection = this.currentNodeData.connections.find(
            (connection) =>
                connection.source === sourceId &&
                connection.sourceHandle === sourceHandle &&
                connection.target === targetId &&
                connection.targetHandle === targetHandle
        );

        if (existingConnection) {
            return false;
        }

        const connection = {
            source: sourceId,
            sourceHandle,
            target: targetId,
            targetHandle,
            type: `${sourceHandle}-${targetHandle}`,
        };

        this.currentNodeData.connections.push(connection);

        const connectionElement = this._createConnectionElement(connection, this.currentNodeData.positions);

        if (connectionElement) {
            this.currentNodeData.connectionsLayer.appendChild(connectionElement);
        }

        return true;
    }

    removeConnection(sourceId, targetId) {
        this.currentNodeData.connections = this.currentNodeData.connections.filter(
            (connection) => !(connection.source === sourceId && connection.target === targetId)
        );

        const connectionElement = this.currentNodeData.connectionsLayer.querySelector(`[data-connection-id="${sourceId}-${targetId}"]`);

        if (connectionElement) {
            connectionElement.remove();
        }
    }

    _buildNodeView(nodeData) {
        const canvas = new Container().setClass("ws-node-canvas");

        if (this.embedded) {
            canvas.setStyle("flex", ["1"]);
            canvas.setStyle("min-height", ["0"]);
            canvas.setStyle("overflow", ["auto"]);
        }

        const canvasInner = new Container().setClass("ws-node-canvas-inner");
        const positions = this._calculateNodePositions(nodeData.nodes);

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        positions.forEach((position) => {
            minX = Math.min(minX, position.x);
            minY = Math.min(minY, position.y);
            maxX = Math.max(maxX, position.x + 250);
            maxY = Math.max(maxY, position.y + 120);
        });

        const sidePadding = 200;
        const canvasWidth = Math.max(maxX - minX + sidePadding * 2, this.embedded ? 800 : Math.max(this.dom.clientWidth, 800));
        const canvasHeight = Math.max(maxY - minY + sidePadding * 2, this.embedded ? 600 : Math.max(this.dom.clientHeight, 600));
        const offsetX = -minX + sidePadding;
        const offsetY = -minY + sidePadding;
        const adjustedPositions = new Map();

        positions.forEach((position, id) => {
            adjustedPositions.set(id, { x: position.x + offsetX, y: position.y + offsetY });
        });

        positions.clear();
        adjustedPositions.forEach((position, id) => positions.set(id, position));

        const miniMap = this._createMiniMap(nodeData.nodes, positions, canvas);
        // Attach to the root (not the scroll canvas) so the minimap stays pinned
        // in embedded hosts; see .ws-node-view-embedded .ws-node-minimap in nodes.css.
        this.add(miniMap);
        canvasInner.setStyle("width", [`${canvasWidth}px`]);
        canvasInner.setStyle("height", [`${canvasHeight}px`]);

        const connectionsLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        connectionsLayer.setAttribute("class", "ws-connections");
        connectionsLayer.setAttribute("width", String(canvasWidth));
        connectionsLayer.setAttribute("height", String(canvasHeight));
        connectionsLayer.style.width = `${canvasWidth}px`;
        connectionsLayer.style.height = `${canvasHeight}px`;
        canvasInner.dom.appendChild(connectionsLayer);

        nodeData.connections.forEach((connection) => {
            const connectionElement = this._createConnectionElement(connection, positions);

            if (connectionElement) {
                connectionsLayer.appendChild(connectionElement);
            }
        });

        nodeData.nodes.forEach((node) => {
            canvasInner.add(this._createNodeElement(node, positions.get(node.id)));
        });

        if (this.highlightByGroup) {
            this._createGroupBackgrounds(nodeData.nodes, canvasInner);
        }

        canvas.add(canvasInner);
        this._makeNodeGraphDraggable(canvasInner, connectionsLayer);
        this.add(canvas);

        let controlsDiv;

        if (this.embedded) {
            controlsDiv = new StackPanel({ isVertical: false });
            controlsDiv.setDisplay("flex");
            controlsDiv.gap("var(--dui-space-2)");
            controlsDiv.setClass("NodeGraphControls");
            controlsDiv.setStyle("position", ["absolute"]);
            controlsDiv.setStyle("top", ["var(--dui-space-2)"]);
            controlsDiv.setStyle("left", ["var(--dui-space-2)"]);
            controlsDiv.setStyle("z-index", ["10"]);
            controlsDiv.setStyle("background", ["var(--dui-color-surface)"]);
            controlsDiv.setStyle("padding", ["var(--dui-space-2)"]);
            controlsDiv.setStyle("border-radius", ["var(--dui-radius)"]);
        } else {
            controlsDiv = new Container();
            controlsDiv.setClass("NodeGraphControls");
        }

        controlsDiv.add(this._createZoomControls(canvas, canvasInner));
        controlsDiv.add(this._createMovePackControl());
        controlsDiv.add(this._createHighlightControl());
        controlsDiv.add(this._createNoOverlapControl());
        this.add(controlsDiv);

        this.currentNodeData = {
            nodeData,
            connections: nodeData.connections,
            positions,
            connectionsLayer,
            canvasInner,
            canvas,
        };

        this._updateNodeVisibility();
        this._updateConnectionsVisibility();
        this.updateConnections = () => this._updateConnectionPaths(connectionsLayer, nodeData.connections, positions);
        window.addEventListener("resize", this.updateConnections);

        setTimeout(() => {
            this._recalculateAllConnections();
            canvas.dom.scrollLeft = (canvasWidth - canvas.dom.clientWidth) / 2;
            canvas.dom.scrollTop = 50;
        }, 100);
    }

    _calculateNodePositions(nodes) {
        return this.noOverlapDisplay
            ? this._calculateNodePositions_NoOverlap(nodes)
            : this._calculateNodePositions_Centered(nodes);
    }

    _calculateNodePositions_Centered(nodes) {
        const positions = new Map();
        const horizontalSpacing = 350;
        const verticalSpacing = 120;
        const nodeHeight = 100;
        const verticalPadding = 20;
        const nodeMap = new Map();
        const occupiedSpace = new Map();
        const rootNodeGraph = nodes.filter((node) => !node.parent || node.parent === 0);

        nodes.forEach((node) => nodeMap.set(node.id, node));

        const wouldOverlap = (x, y) => {
            const ranges = occupiedSpace.get(x) || [];
            const nodeMinY = y;
            const nodeMaxY = y + nodeHeight + verticalPadding;

            for (const range of ranges) {
                if (!(nodeMaxY <= range.minY || nodeMinY >= range.maxY)) {
                    return true;
                }
            }

            return false;
        };

        const markOccupied = (x, y) => {
            if (!occupiedSpace.has(x)) {
                occupiedSpace.set(x, []);
            }

            occupiedSpace.get(x).push({ minY: y, maxY: y + nodeHeight + verticalPadding });
        };

        const findNextAvailableY = (x, preferredY) => {
            let candidateY = preferredY;

            while (wouldOverlap(x, candidateY)) {
                candidateY += verticalSpacing;
            }

            return candidateY;
        };

        const positionNodeAndChildren = (node, x, y) => {
            positions.set(node.id, { x, y });
            markOccupied(x, y);

            const children = nodes.filter((candidate) => node.children && node.children.includes(candidate.id));

            if (children.length > 0) {
                const childX = x + horizontalSpacing;
                const totalChildrenHeight = (children.length - 1) * verticalSpacing;
                const idealStartY = y - totalChildrenHeight / 2;

                children.forEach((child, index) => {
                    const actualY = findNextAvailableY(childX, idealStartY + index * verticalSpacing);
                    positionNodeAndChildren(child, childX, actualY);
                });
            }
        };

        let currentY = 100;

        rootNodeGraph.forEach((rootNode) => {
            positionNodeAndChildren(rootNode, 100, currentY);
            currentY += Math.max(verticalSpacing * 2, this._countDescendants(rootNode, nodeMap) * 80);
        });

        return positions;
    }

    _calculateNodePositions_NoOverlap(nodes) {
        const positions = new Map();
        const horizontalSpacing = 350;
        const verticalSpacing = 120;
        const minNodeHeight = 100;
        const nodeMap = new Map();
        const rootNodeGraph = nodes.filter((node) => !node.parent || node.parent === 0);

        nodes.forEach((node) => nodeMap.set(node.id, node));

        const calculateSubtreeHeight = (nodeId) => {
            const node = nodeMap.get(nodeId);

            if (!node || !node.children || node.children.length === 0) {
                return minNodeHeight;
            }

            let totalChildrenHeight = 0;
            node.children.forEach((childId) => {
                totalChildrenHeight += calculateSubtreeHeight(childId);
            });

            return Math.max(minNodeHeight, totalChildrenHeight + (node.children.length - 1) * verticalSpacing);
        };

        const positionSubtree = (nodeId, x, startY) => {
            const node = nodeMap.get(nodeId);

            if (!node) {
                return minNodeHeight;
            }

            const children = nodes.filter((candidate) => node.children && node.children.includes(candidate.id));

            if (children.length === 0) {
                positions.set(nodeId, { x, y: startY });
                return minNodeHeight;
            }

            const childHeights = children.map((child) => calculateSubtreeHeight(child.id));
            const subtreeHeight = childHeights.reduce((sum, height) => sum + height, 0) + (children.length - 1) * verticalSpacing;
            positions.set(nodeId, { x, y: startY + subtreeHeight / 2 - minNodeHeight / 2 });

            let currentChildY = startY;
            children.forEach((child) => {
                const childHeight = positionSubtree(child.id, x + horizontalSpacing, currentChildY);
                currentChildY += childHeight + verticalSpacing;
            });

            return subtreeHeight;
        };

        let currentY = 100;
        rootNodeGraph.forEach((rootNode) => {
            const treeHeight = positionSubtree(rootNode.id, 100, currentY);
            currentY += treeHeight + verticalSpacing * 2;
        });

        return positions;
    }

    _countDescendants(node, nodeMap) {
        if (!node.children || node.children.length === 0) {
            return 1;
        }

        let count = 1;

        node.children.forEach((childId) => {
            const child = nodeMap.get(childId);

            if (child) {
                count += this._countDescendants(child, nodeMap);
            }
        });

        return count;
    }

    _createGroupBackgrounds(nodes, canvasInner) {
        canvasInner.dom.querySelectorAll(".ws-node-group-background").forEach((element) => element.remove());

        const nodeMap = new Map();
        nodes.forEach((node) => nodeMap.set(node.id, node));

        const getGroupBounds = (nodeId, level = 0) => {
            const node = nodeMap.get(nodeId);

            if (!node) {
                return null;
            }

            const nodeElement = canvasInner.dom.querySelector(`[data-node-id="${nodeId}"]`);

            if (!nodeElement || nodeElement.style.display === "none") {
                return null;
            }

            const nodeRect = {
                left: parseFloat(nodeElement.style.left) || 0,
                top: parseFloat(nodeElement.style.top) || 0,
                width: nodeElement.offsetWidth,
                height: nodeElement.offsetHeight,
            };
            const padding = 20 + level * 10;
            const bounds = {
                minX: nodeRect.left - padding,
                maxX: nodeRect.left + nodeRect.width + padding,
                minY: nodeRect.top - padding,
                maxY: nodeRect.top + nodeRect.height + padding,
                level,
                hasVisibleChildren: false,
            };

            if (node.children && node.children.length > 0 && this.hierarchyToggleUtil.isExpanded(nodeId)) {
                node.children.forEach((childId) => {
                    const childElement = canvasInner.dom.querySelector(`[data-node-id="${childId}"]`);

                    if (childElement && childElement.style.display !== "none") {
                        bounds.hasVisibleChildren = true;
                        const childBounds = getGroupBounds(childId, level + 1);

                        if (childBounds) {
                            bounds.minX = Math.min(bounds.minX, childBounds.minX);
                            bounds.maxX = Math.max(bounds.maxX, childBounds.maxX);
                            bounds.minY = Math.min(bounds.minY, childBounds.minY);
                            bounds.maxY = Math.max(bounds.maxY, childBounds.maxY);
                        }
                    }
                });
            }

            return bounds;
        };

        const createGroupBackground = (nodeId, level = 0) => {
            const node = nodeMap.get(nodeId);

            if (!node || !node.children || node.children.length === 0 || !this.hierarchyToggleUtil.isExpanded(nodeId)) {
                return;
            }

            const bounds = getGroupBounds(nodeId, level);

            if (!bounds || !bounds.hasVisibleChildren) {
                return;
            }

            const groupBackground = new Container()
                .addClass("ws-node-group-background")
                .dom;
            groupBackground.setAttribute("data-parent-id", nodeId);
            groupBackground.setAttribute("data-level", level);
            groupBackground.style.position = "absolute";
            groupBackground.style.left = `${bounds.minX}px`;
            groupBackground.style.top = `${bounds.minY}px`;
            groupBackground.style.width = `${bounds.maxX - bounds.minX}px`;
            groupBackground.style.height = `${bounds.maxY - bounds.minY}px`;
            groupBackground.style.borderRadius = "var(--dui-radius)";
            groupBackground.style.background = `hsla(${(level * 30) % 360}, 70%, 50%, ${Math.max(0.03, 0.08 - level * 0.015)})`;
            groupBackground.style.border = `1px solid hsla(${(level * 30) % 360}, 70%, 50%, ${Math.max(0.03, 0.08 - level * 0.015) * 2})`;
            groupBackground.style.pointerEvents = "none";
            groupBackground.style.zIndex = "0";
            canvasInner.dom.appendChild(groupBackground);

            node.children.forEach((childId) => createGroupBackground(childId, level + 1));
        };

        nodes.filter((node) => !node.parent || node.parent === 0).forEach((rootNode) => {
            createGroupBackground(rootNode.id, 0);
        });
    }

    _createNodeElement(node, position) {
        const nodeElement = new Container();
        nodeElement.addClass("ws-node").addClass(`ws-node-status-${node.status.toLowerCase()}`);
        nodeElement.dom.setAttribute("data-node-id", node.id);
        nodeElement.setStyle("left", [`${position.x}px`]);
        nodeElement.setStyle("top", [`${position.y}px`]);

        if (node.color) {
            nodeElement.setStyle("borderColor", [node.color]);
            nodeElement.setStyle("boxShadow", [`0 0 10px ${node.color}40`]);
        }

        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = this.hierarchyToggleUtil.isExpanded(node.id);

        if (this.allowConnections) {
            const handles = new Container().addClass("ws-node-handles");
            const inputHandle = new Container().addClass("ws-node-handle").addClass("input");
            inputHandle.dom.setAttribute("data-handle", "input");
            handles.add(inputHandle);

            const outputHandle = new Container().addClass("ws-node-handle").addClass("output");
            outputHandle.dom.setAttribute("data-handle", "output");
            handles.add(outputHandle);

            nodeElement.add(handles);
        }

        const header = new Container().addClass("ws-node-header");

        if (hasChildren) {
            const rollButton = new Button(isExpanded ? "v" : ">");
            rollButton.addClass("ws-node-roll-btn");
            rollButton.setTooltip(isExpanded ? "Collapse" : "Expand");
            rollButton.onClick((event) => {
                event.stopPropagation();
                this.toggleNodeChildren(node.id);
            });
            header.add(rollButton);
        }

        const nodeIcon = new Container().addClass("ws-node-icon");
        const nodeIconLabel = new Span();
        nodeIconLabel.setTextContent("T");
        nodeIcon.add(nodeIconLabel);
        header.add(nodeIcon);

        const nodeTitle = new Container().addClass("ws-node-title");
        const nodeTitleLabel = new Span();
        nodeTitleLabel.setTextContent(node.name);
        nodeTitle.add(nodeTitleLabel);
        header.add(nodeTitle);

        const nodeStatus = new Container().addClass("ws-node-status").addClass(node.status.toLowerCase());
        const nodeStatusLabel = new Span();
        nodeStatusLabel.setTextContent(node.status);
        nodeStatus.add(nodeStatusLabel);
        header.add(nodeStatus);
        nodeElement.add(header);

        const content = new Container().addClass("ws-node-content");
        const meta = new Container().addClass("ws-node-meta");
        const levelItem = new Container().setStyles({
            position: "absolute",
            bottom: "0",
            right: "0",
            margin: "var(--dui-space-2)",
        });
        const levelLabel = new Span();
        levelLabel.setTextContent("Level ");
        levelLabel.addClass("hud-label");
        const levelValue = new Span();
        levelValue.setTextContent(String(node.level));
        levelItem.add(levelLabel, levelValue);
        meta.add(levelItem);

        const childrenItem = new Container().addClass("ws-node-meta-item");
        const childrenLabel = new Span();
        childrenLabel.setTextContent("Children ");
        childrenLabel.addClass("hud-label");
        childrenItem.add(childrenLabel);
        const childrenValue = new Span();
        childrenValue.setTextContent(String((node.children || []).length));
        childrenItem.add(childrenValue);
        meta.add(childrenItem);
        content.add(meta);
        nodeElement.add(content);

        const toolbar = new Container().addClass("ws-node-toolbar");
        const editButton = new Container();
        editButton.addClass("Operator");
        const editIcon = new Icon("edit");
        editButton.add(editIcon);
        editButton.setIcon = (name) => {
            editIcon.setName(name);
        };
        editButton.setTooltip("Edit");
        editButton.dom.setAttribute("data-action", "edit");
        editButton.onClick((event) => {
            event.stopPropagation();

            if (typeof this.onEdit === "function") {
                this.onEdit(node);
            }
        });
        toolbar.add(editButton);

        if (typeof this.onDelete === "function") {
            const deleteButton = new Container();
            deleteButton.addClass("Operator");
            const deleteIcon = new Icon("delete");
            deleteButton.add(deleteIcon);
            deleteButton.setIcon = (name) => {
                deleteIcon.setName(name);
            };
            deleteButton.setTooltip("Delete");
            deleteButton.dom.setAttribute("data-action", "delete");
            deleteButton.onClick((event) => {
                event.stopPropagation();
                this.onDelete(node);
            });
            toolbar.add(deleteButton);
        }

        nodeElement.add(toolbar);

        if (typeof this.onNodeClick === "function") {
            nodeElement.onClick((event) => {
                const target = event.target;
                const isButton = target instanceof Element && (
                    target.closest('[data-action="edit"]') ||
                    target.closest('[data-action="delete"]') ||
                    target.closest(".ws-node-roll-btn")
                );

                if (!isButton) {
                    this.onNodeClick(node);
                }
            });
        }

        return nodeElement;
    }

    _updateNodeVisibility() {
        const nodeMap = new Map();
        this.currentNodeData.nodeData.nodes.forEach((node) => nodeMap.set(node.id, node));

        const shouldBeVisible = (nodeId) => {
            let currentId = nodeId;

            while (currentId) {
                const node = nodeMap.get(currentId);

                if (!node) {
                    break;
                }

                let parentId = null;

                for (const [id, candidate] of nodeMap) {
                    if (!candidate.children || candidate.children.length === 0) {
                        continue;
                    }

                    if (candidate.children.some((childId) => childId == currentId)) {
                        parentId = id;
                        break;
                    }
                }

                if (parentId && !this.hierarchyToggleUtil.isExpanded(parentId)) {
                    return false;
                }

                currentId = parentId;
            }

            return true;
        };

        this.currentNodeData.nodeData.nodes.forEach((node) => {
            const nodeElement = this.currentNodeData.canvasInner.dom.querySelector(`[data-node-id="${node.id}"]`);

            if (nodeElement) {
                nodeElement.style.display = shouldBeVisible(node.id) ? "block" : "none";
            }
        });
    }

    _updateConnectionsVisibility() {
        const visibleNodeIds = new Set();

        this.currentNodeData.nodeData.nodes.forEach((node) => {
            const nodeElement = this.currentNodeData.connectionsLayer.parentElement.querySelector(`[data-node-id="${node.id}"]`);

            if (nodeElement && nodeElement.style.display !== "none") {
                visibleNodeIds.add(node.id);
            }
        });

        this.currentNodeData.nodeData.connections.forEach((connection) => {
            const connectionElement = this.currentNodeData.connectionsLayer.querySelector(`[data-connection-id="${connection.source}-${connection.target}"]`);

            if (connectionElement) {
                connectionElement.style.display = visibleNodeIds.has(connection.source) && visibleNodeIds.has(connection.target)
                    ? "block"
                    : "none";
            }
        });
    }

    _updateMiniMap() {
        const miniMap = this.dom.querySelector(".ws-node-minimap");

        if (miniMap) {
            miniMap.replaceWith(
                this._createMiniMap(this.currentNodeData.nodeData.nodes, this.currentNodeData.positions, this.currentNodeData.canvas).dom
            );
        }
    }

    _recalculateCanvasBounds() {
        if (!this.currentNodeData) {
            return;
        }

        const canvasInner = this.currentNodeData.canvasInner;
        const connectionsLayer = this.currentNodeData.connectionsLayer;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        canvasInner.dom.querySelectorAll(".ws-node").forEach((nodeElement) => {
            const x = parseFloat(nodeElement.style.left) || 0;
            const y = parseFloat(nodeElement.style.top) || 0;
            const width = nodeElement.offsetWidth || 250;
            const height = nodeElement.offsetHeight || 120;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + width);
            maxY = Math.max(maxY, y + height);
        });

        const sidePadding = 200;
        const canvasWidth = Math.max(maxX - minX + sidePadding * 2, this.dom.clientWidth || 1200);
        const canvasHeight = Math.max(maxY - minY + sidePadding * 2, this.dom.clientHeight || 800);

        canvasInner.setStyle("width", [`${canvasWidth}px`]);
        canvasInner.setStyle("height", [`${canvasHeight}px`]);
        connectionsLayer.setAttribute("width", canvasWidth);
        connectionsLayer.setAttribute("height", canvasHeight);
        connectionsLayer.style.width = `${canvasWidth}px`;
        connectionsLayer.style.height = `${canvasHeight}px`;

        this._clampCanvasScroll(canvasInner.dom.parentElement, canvasInner);
    }

    _clampCanvasScroll(canvas, canvasInner) {
        if (!canvas || !canvasInner?.dom) {
            return;
        }

        const maxScrollLeft = Math.max(0, canvasInner.dom.offsetWidth - canvas.clientWidth);
        const maxScrollTop = Math.max(0, canvasInner.dom.offsetHeight - canvas.clientHeight);
        canvas.scrollLeft = Math.min(Math.max(0, Number.isNaN(canvas.scrollLeft) ? 0 : canvas.scrollLeft), maxScrollLeft);
        canvas.scrollTop = Math.min(Math.max(0, Number.isNaN(canvas.scrollTop) ? 0 : canvas.scrollTop), maxScrollTop);
    }

    _repositionChildrenRelativeToParent(parentId) {
        if (this.noOverlapDisplay) {
            this._repositionChildrenRelativeToParent_NoOverlap(parentId);
        } else {
            this._repositionChildrenRelativeToParent_Centered(parentId);
        }
    }

    _repositionChildrenRelativeToParent_Centered(parentId) {
        const parentElement = this.currentNodeData.canvasInner.dom.querySelector(`[data-node-id="${parentId}"]`);

        if (!parentElement) {
            return;
        }

        const parentX = parseFloat(parentElement.style.left) || 0;
        const parentY = parseFloat(parentElement.style.top) || 0;
        const parentHeight = parentElement.offsetHeight;
        const parentNode = this.currentNodeData.nodeData.nodes.find((node) => node.id === parentId);

        if (!parentNode?.children?.length) {
            return;
        }

        const children = this.currentNodeData.nodeData.nodes.filter((node) => parentNode.children.includes(node.id));
        const horizontalOffset = 350;
        const verticalSpacing = 120;
        const nodeHeight = 100;
        const verticalPadding = 20;
        const totalChildrenHeight = (children.length - 1) * verticalSpacing;
        const parentCenterY = parentY + parentHeight / 2;
        const idealStartY = parentCenterY - totalChildrenHeight / 2;
        const childX = parentX + horizontalOffset;
        const childIds = children.map((child) => child.id);

        const wouldOverlap = (x, y, excludedIds = []) => {
            const targetX = Math.round(x);
            const allNodeGraph = this.currentNodeData.canvasInner.dom.querySelectorAll(".ws-node");

            for (const node of allNodeGraph) {
                const nodeId = parseInt(node.getAttribute("data-node-id"), 10);

                if (excludedIds.includes(nodeId) || node.style.display === "none") {
                    continue;
                }

                const nodeX = Math.round(parseFloat(node.style.left) || 0);
                const nodeY = parseFloat(node.style.top) || 0;

                if (Math.abs(nodeX - targetX) < 10) {
                    const nodeMinY = nodeY;
                    const nodeMaxY = nodeY + nodeHeight + verticalPadding;
                    const candidateMinY = y;
                    const candidateMaxY = y + nodeHeight + verticalPadding;

                    if (!(candidateMaxY <= nodeMinY || candidateMinY >= nodeMaxY)) {
                        return true;
                    }
                }
            }

            return false;
        };

        const findNextAvailableY = (x, preferredY, excludedIds = []) => {
            let candidateY = preferredY;

            while (wouldOverlap(x, candidateY, excludedIds)) {
                candidateY += verticalSpacing;
            }

            return candidateY;
        };

        children.forEach((child, index) => {
            const childElement = this.currentNodeData.canvasInner.dom.querySelector(`[data-node-id="${child.id}"]`);

            if (!childElement) {
                return;
            }

            const newY = findNextAvailableY(childX, idealStartY + index * verticalSpacing, childIds);
            childElement.style.left = `${childX}px`;
            childElement.style.top = `${newY}px`;
            this.currentNodeData.positions.set(child.id, { x: childX, y: newY });

            if (this.hierarchyToggleUtil.isExpanded(child.id)) {
                this._repositionChildrenRelativeToParent(child.id);
            }
        });

        this._updateConnectionPaths(this.currentNodeData.connectionsLayer);
        this._recalculateCanvasBounds();
    }

    _repositionChildrenRelativeToParent_NoOverlap(parentId) {
        const parentElement = this.currentNodeData.canvasInner.dom.querySelector(`[data-node-id="${parentId}"]`);

        if (!parentElement) {
            return;
        }

        const parentX = parseFloat(parentElement.style.left) || 0;
        const parentY = parseFloat(parentElement.style.top) || 0;
        const parentNode = this.currentNodeData.nodeData.nodes.find((node) => node.id === parentId);

        if (!parentNode?.children?.length) {
            return;
        }

        const children = this.currentNodeData.nodeData.nodes.filter((node) => parentNode.children.includes(node.id));
        const horizontalOffset = 350;
        const verticalSpacing = 120;
        const minNodeHeight = 100;
        const nodeMap = new Map();
        this.currentNodeData.nodeData.nodes.forEach((node) => nodeMap.set(node.id, node));

        const calculateSubtreeHeight = (nodeId) => {
            const node = nodeMap.get(nodeId);

            if (!node || !node.children || node.children.length === 0 || !this.hierarchyToggleUtil.isExpanded(nodeId)) {
                return minNodeHeight;
            }

            let totalChildrenHeight = 0;
            node.children.forEach((childId) => {
                totalChildrenHeight += calculateSubtreeHeight(childId);
            });

            return Math.max(minNodeHeight, totalChildrenHeight + (node.children.length - 1) * verticalSpacing);
        };

        const positionSubtree = (nodeId, x, startY) => {
            const node = nodeMap.get(nodeId);
            const nodeElement = this.currentNodeData.canvasInner.dom.querySelector(`[data-node-id="${nodeId}"]`);

            if (!node || !nodeElement) {
                return minNodeHeight;
            }

            const visibleChildren = this.currentNodeData.nodeData.nodes.filter(
                (candidate) => node.children && node.children.includes(candidate.id) && this.hierarchyToggleUtil.isExpanded(nodeId)
            );

            if (visibleChildren.length === 0) {
                nodeElement.style.left = `${x}px`;
                nodeElement.style.top = `${startY}px`;
                this.currentNodeData.positions.set(nodeId, { x, y: startY });
                return minNodeHeight;
            }

            const childHeights = visibleChildren.map((child) => calculateSubtreeHeight(child.id));
            const subtreeHeight = childHeights.reduce((sum, height) => sum + height, 0) + (visibleChildren.length - 1) * verticalSpacing;
            const nodeY = startY + subtreeHeight / 2 - minNodeHeight / 2;

            nodeElement.style.left = `${x}px`;
            nodeElement.style.top = `${nodeY}px`;
            this.currentNodeData.positions.set(nodeId, { x, y: nodeY });

            let currentChildY = startY;
            visibleChildren.forEach((child) => {
                const childHeight = positionSubtree(child.id, x + horizontalOffset, currentChildY);
                currentChildY += childHeight + verticalSpacing;
            });

            return subtreeHeight;
        };

        const totalHeight = children.map((child) => calculateSubtreeHeight(child.id)).reduce((sum, height) => sum + height, 0);
        const subtreeHeight = totalHeight + (children.length - 1) * verticalSpacing;
        let currentY = parentY + parentElement.offsetHeight / 2 - subtreeHeight / 2;

        children.forEach((child) => {
            const childHeight = positionSubtree(child.id, parentX + horizontalOffset, currentY);
            currentY += childHeight + verticalSpacing;
        });

        this._updateConnectionPaths(this.currentNodeData.connectionsLayer);
        this._recalculateCanvasBounds();
    }

    _createConnectionElement(connection, positions) {
        const sourcePos = positions.get(connection.source);
        const targetPos = positions.get(connection.target);

        if (!sourcePos || !targetPos) {
            return null;
        }

        const connectionGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        connectionGroup.setAttribute("class", "ws-connection");
        connectionGroup.setAttribute("data-connection-id", `${connection.source}-${connection.target}`);

        const sourceNode = document.querySelector(`[data-node-id="${connection.source}"]`);
        const targetNode = document.querySelector(`[data-node-id="${connection.target}"]`);
        const sourceWidth = sourceNode ? sourceNode.offsetWidth : 200;
        const sourceHeight = sourceNode ? sourceNode.offsetHeight : 90;
        const targetWidth = targetNode ? targetNode.offsetWidth : 200;
        const targetHeight = targetNode ? targetNode.offsetHeight : 90;

        const startX = connection.sourceHandle === "output" ? sourcePos.x + sourceWidth : sourcePos.x;
        const startY = sourcePos.y + sourceHeight / 2;
        const endX = connection.targetHandle === "input" ? targetPos.x : targetPos.x + targetWidth;
        const endY = targetPos.y + targetHeight / 2;
        const dx = endX - startX;
        const cp1x = startX + Math.max(Math.abs(dx) * 0.5, 50);
        const cp2x = endX - Math.max(Math.abs(dx) * 0.5, 50);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "ws-connection-path");
        path.setAttribute("d", `M ${startX} ${startY} C ${cp1x} ${startY} ${cp2x} ${endY} ${endX} ${endY}`);
        path.setAttribute("stroke", connection.color || "#0a84ff");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "none");
        connectionGroup.appendChild(path);

        return connectionGroup;
    }

    _createZoomControls(canvas, canvasInner) {
        const controls = new Container().addClass("ws-node-zoom-controls");
        let scale = 1;
        const zoomIn = new Button("+").addClass("ws-zoom-btn");
        zoomIn.dom.setAttribute("data-action", "zoom-in");
        controls.add(zoomIn);

        const zoomOut = new Button("-").addClass("ws-zoom-btn");
        zoomOut.dom.setAttribute("data-action", "zoom-out");
        controls.add(zoomOut);

        const fit = new Button("Fit").addClass("ws-zoom-btn");
        fit.dom.setAttribute("data-action", "fit");
        controls.add(fit);

        const applyZoom = (newScale) => {
            scale = newScale;
            canvasInner.dom.style.transform = `scale(${scale})`;
            const svg = canvasInner.dom.querySelector(".ws-connections");

            if (svg) {
                svg.style.width = `${parseInt(svg.getAttribute("width"), 10)}px`;
                svg.style.height = `${parseInt(svg.getAttribute("height"), 10)}px`;
            }
        };

        zoomIn.onClick(() => applyZoom(Math.min(scale * 1.2, 2)));
        zoomOut.onClick(() => applyZoom(Math.max(scale / 1.2, 0.3)));
        fit.onClick(() => {
            applyZoom(1);
            canvas.dom.scrollLeft = (canvasInner.dom.offsetWidth - canvas.dom.clientWidth) / 2;
            canvas.dom.scrollTop = 50;
        });

        return controls;
    }

    _createMovePackControl() {
        const control = new Container().addClass("ws-node-move-pack-control");
        const label = new Container()
            .setStyle("display", ["flex"])
            .setStyle("align-items", ["center"])
            .setStyle("gap", ["8px"])
            .setStyle("padding", ["8px 12px"])
            .setStyle("background", ["rgba(255,255,255,0.05)"])
            .setStyle("border-radius", ["var(--dui-radius)"])
            .setStyle("cursor", ["pointer"]);
        const checkbox = new Checkbox(this.moveInPack).addClass("Card-checkbox");
        checkbox.dom.style.cursor = "pointer";
        checkbox.dom.addEventListener("change", () => {
            this.moveInPack = checkbox.getValue();
        });
        const labelText = new Span();
        labelText.setTextContent("Move in Pack")
            .setStyle("font-size", ["12px"])
            .setStyle("color", ["#fff"]);
        label.add(checkbox, labelText);
        label.onClick((event) => {
            if (event.target !== checkbox.dom) {
                checkbox.dom.click();
            }
        });
        control.add(label);

        return control;
    }

    _createHighlightControl() {
        const control = new Container().addClass("ws-node-highlight-control");
        const label = new Container()
            .setStyle("display", ["flex"])
            .setStyle("align-items", ["center"])
            .setStyle("gap", ["8px"])
            .setStyle("padding", ["8px 12px"])
            .setStyle("background", ["rgba(255,255,255,0.05)"])
            .setStyle("border-radius", ["var(--dui-radius)"])
            .setStyle("cursor", ["pointer"]);
        const checkbox = new Checkbox(this.highlightByGroup).addClass("Card-checkbox");
        checkbox.dom.style.cursor = "pointer";
        checkbox.dom.addEventListener("change", () => {
            this.highlightByGroup = checkbox.getValue();

            if (this.currentNodeData) {
                this._createGroupBackgrounds(this.currentNodeData.nodeData.nodes, this.currentNodeData.canvasInner);
            }
        });
        const labelText = new Span();
        labelText.setTextContent("Highlight by Group")
            .setStyle("font-size", ["12px"])
            .setStyle("color", ["#fff"]);
        label.add(checkbox, labelText);
        label.onClick((event) => {
            if (event.target !== checkbox.dom) {
                checkbox.dom.click();
            }
        });
        control.add(label);

        return control;
    }

    _createNoOverlapControl() {
        const control = new Container().addClass("ws-node-no-overlap-control");
        const label = new Container()
            .setStyle("display", ["flex"])
            .setStyle("align-items", ["center"])
            .setStyle("gap", ["8px"])
            .setStyle("padding", ["8px 12px"])
            .setStyle("background", ["rgba(255,255,255,0.05)"])
            .setStyle("border-radius", ["var(--dui-radius)"])
            .setStyle("cursor", ["pointer"]);
        const checkbox = new Checkbox(this.noOverlapDisplay).addClass("Card-checkbox");
        checkbox.dom.style.cursor = "pointer";
        checkbox.dom.addEventListener("change", () => {
            this.noOverlapDisplay = checkbox.getValue();

            if (!this.currentNodeData) {
                return;
            }

            const newPositions = this._calculateNodePositions(this.currentNodeData.nodeData.nodes);
            this.currentNodeData.nodeData.nodes.forEach((node) => {
                const nodeElement = this.currentNodeData.canvasInner.dom.querySelector(`[data-node-id="${node.id}"]`);
                const newPosition = newPositions.get(node.id);

                if (nodeElement && newPosition) {
                    nodeElement.style.left = `${newPosition.x}px`;
                    nodeElement.style.top = `${newPosition.y}px`;
                }
            });

            this.currentNodeData.positions = newPositions;
            this._recalculateCanvasBounds();
            this._recalculateAllConnections();

            if (this.highlightByGroup) {
                this._createGroupBackgrounds(this.currentNodeData.nodeData.nodes, this.currentNodeData.canvasInner);
            }
        });
        const labelText = new Span();
        labelText.setTextContent("No Overlap Display")
            .setStyle("font-size", ["12px"])
            .setStyle("color", ["#fff"]);
        label.add(checkbox, labelText);
        label.onClick((event) => {
            if (event.target !== checkbox.dom) {
                checkbox.dom.click();
            }
        });
        control.add(label);

        return control;
    }

    _createMiniMap(nodes, positions, canvas) {
        const miniMap = new Container();
        miniMap.setClass("ws-node-minimap");

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        positions.forEach((position) => {
            minX = Math.min(minX, position.x);
            minY = Math.min(minY, position.y);
            maxX = Math.max(maxX, position.x + 200);
            maxY = Math.max(maxY, position.y + 80);
        });

        const scaleX = 150 / (maxX - minX || 1);
        const scaleY = 100 / (maxY - minY || 1);

        nodes.forEach((node) => {
            const nodeElement = canvas.dom.querySelector(`[data-node-id="${node.id}"]`);

            if (nodeElement && nodeElement.style.display === "none") {
                return;
            }

            const position = positions.get(node.id);

            if (!position) {
                return;
            }

            const nodeDot = new Container();
            nodeDot.setClass("ws-minimap-node");
            nodeDot.setStyle("left", [`${(position.x - minX) * scaleX}px`]);
            nodeDot.setStyle("top", [`${(position.y - minY) * scaleY}px`]);
            miniMap.add(nodeDot);
        });

        return miniMap;
    }

    _makeNodeGraphDraggable(canvasInner, connectionsLayer) {
        let draggedElement = null;
        let draggedHandle = null;
        let tempConnection = null;
        let isPanning = false;
        let offsetX = 0;
        let offsetY = 0;
        let panStartX = 0;
        let panStartY = 0;
        const canvas = canvasInner.dom.parentElement;

        canvas.addEventListener("mousedown", (event) => {
            const handle = event.target.closest(".ws-node-handle");
            const node = event.target.closest(".ws-node");

            if (this.allowConnections && handle && !event.target.closest("button")) {
                draggedHandle = {
                    element: handle,
                    nodeId: parseInt(node.getAttribute("data-node-id"), 10),
                    handleType: handle.getAttribute("data-handle"),
                };
                tempConnection = this._createTempConnection(connectionsLayer);
                event.preventDefault();
                return;
            }

            if (node && !event.target.closest("button") && !handle) {
                draggedElement = node;
                draggedElement.classList.add("dragging");
                const transform = window.getComputedStyle(canvasInner.dom).transform;
                let scale = 1;

                if (transform && transform !== "none") {
                    scale = new DOMMatrix(transform).a;
                }

                const rect = draggedElement.getBoundingClientRect();
                offsetX = (event.clientX - rect.left) / scale;
                offsetY = (event.clientY - rect.top) / scale;
                event.preventDefault();
                return;
            }

            if (!node && !handle) {
                isPanning = true;
                panStartX = event.clientX + canvas.scrollLeft;
                panStartY = event.clientY + canvas.scrollTop;
                canvas.style.cursor = "grabbing";
                event.preventDefault();
            }
        });

        document.addEventListener("mousemove", (event) => {
            if (draggedHandle) {
                this._updateTempConnection(tempConnection, draggedHandle, event, canvasInner);
                return;
            }

            if (draggedElement) {
                const transform = window.getComputedStyle(canvasInner.dom).transform;
                let scale = 1;

                if (transform && transform !== "none") {
                    scale = new DOMMatrix(transform).a;
                }

                const canvasRect = canvasInner.dom.getBoundingClientRect();
                const x = (event.clientX - canvasRect.left) / scale - offsetX;
                const y = (event.clientY - canvasRect.top) / scale - offsetY;
                draggedElement.style.left = `${x}px`;
                draggedElement.style.top = `${y}px`;
                this._updateConnectionsForNode(draggedElement, connectionsLayer);
                return;
            }

            if (isPanning) {
                const newLeft = panStartX - event.clientX;
                const newTop = panStartY - event.clientY;
                canvas.scrollLeft = Math.min(Math.max(0, newLeft), Math.max(0, canvasInner.dom.offsetWidth - canvas.clientWidth));
                canvas.scrollTop = Math.min(Math.max(0, newTop), Math.max(0, canvasInner.dom.offsetHeight - canvas.clientHeight));
            }
        });

        document.addEventListener("mouseup", (event) => {
            if (draggedHandle) {
                const targetHandle = event.target.closest(".ws-node-handle");

                if (targetHandle) {
                    const targetNode = targetHandle.closest(".ws-node");
                    const targetNodeId = parseInt(targetNode.getAttribute("data-node-id"), 10);
                    const targetHandleType = targetHandle.getAttribute("data-handle");

                    if (targetNodeId !== draggedHandle.nodeId) {
                        this.addConnection(draggedHandle.nodeId, draggedHandle.handleType, targetNodeId, targetHandleType);
                    }
                }

                if (tempConnection) {
                    tempConnection.remove();
                    tempConnection = null;
                }

                draggedHandle = null;
                return;
            }

            if (draggedElement) {
                draggedElement.classList.remove("dragging");
                const nodeId = parseInt(draggedElement.getAttribute("data-node-id"), 10);
                const x = parseFloat(draggedElement.style.left) || 0;
                const y = parseFloat(draggedElement.style.top) || 0;
                this.currentNodeData.positions.set(nodeId, { x, y });

                if (this.moveInPack && this.hierarchyToggleUtil.isExpanded(nodeId)) {
                    this._repositionChildrenRelativeToParent(nodeId);
                }

                if (this.highlightByGroup) {
                    this._createGroupBackgrounds(this.currentNodeData.nodeData.nodes, this.currentNodeData.canvasInner);
                }

                draggedElement = null;
                return;
            }

            if (isPanning) {
                this._clampCanvasScroll(canvas, canvasInner);
                isPanning = false;
                canvas.style.cursor = "";
            }
        });
    }

    _createTempConnection(connectionsLayer) {
        const tempGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        tempGroup.setAttribute("class", "ws-connection-temp");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "ws-connection-path");
        path.setAttribute("stroke", "#0a84ff");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-dasharray", "5,5");
        path.setAttribute("fill", "none");
        tempGroup.appendChild(path);
        connectionsLayer.appendChild(tempGroup);

        return tempGroup;
    }

    _updateTempConnection(tempConnection, draggedHandle, mouseEvent, canvasInner) {
        const path = tempConnection.querySelector(".ws-connection-path");

        if (!path) {
            return;
        }

        const handleRect = draggedHandle.element.getBoundingClientRect();
        const canvasRect = canvasInner.dom.getBoundingClientRect();
        const startX = handleRect.left + handleRect.width / 2 - canvasRect.left;
        const startY = handleRect.top + handleRect.height / 2 - canvasRect.top;
        const endX = mouseEvent.clientX - canvasRect.left;
        const endY = mouseEvent.clientY - canvasRect.top;
        path.setAttribute("d", `M ${startX} ${startY} L ${endX} ${endY}`);
    }

    _updateConnectionsForNode(nodeElement, connectionsLayer) {
        const nodeId = parseInt(nodeElement.getAttribute("data-node-id"), 10);

        connectionsLayer.querySelectorAll(".ws-connection").forEach((connectionGroup) => {
            const path = connectionGroup.querySelector(".ws-connection-path");

            if (!path) {
                return;
            }

            const [sourceId, targetId] = connectionGroup
                .getAttribute("data-connection-id")
                .split("-")
                .map((id) => parseInt(id, 10));

            if (sourceId !== nodeId && targetId !== nodeId) {
                return;
            }

            const connection = this.currentNodeData.connections.find(
                (candidate) => candidate.source === sourceId && candidate.target === targetId
            );

            if (!connection) {
                return;
            }

            const sourceNode = connectionsLayer.parentElement.querySelector(`[data-node-id="${sourceId}"]`);
            const targetNode = connectionsLayer.parentElement.querySelector(`[data-node-id="${targetId}"]`);

            if (!sourceNode || !targetNode) {
                return;
            }

            const sourceX = parseFloat(sourceNode.style.left) || 0;
            const sourceY = parseFloat(sourceNode.style.top) || 0;
            const targetX = parseFloat(targetNode.style.left) || 0;
            const targetY = parseFloat(targetNode.style.top) || 0;
            const sourceWidth = sourceNode.offsetWidth;
            const sourceHeight = sourceNode.offsetHeight;
            const targetWidth = targetNode.offsetWidth;
            const targetHeight = targetNode.offsetHeight;
            const startX = connection.sourceHandle === "output" ? sourceX + sourceWidth : sourceX;
            const startY = sourceY + sourceHeight / 2;
            const endX = connection.targetHandle === "input" ? targetX : targetX + targetWidth;
            const endY = targetY + targetHeight / 2;
            const dx = endX - startX;
            const cp1x = startX + Math.max(Math.abs(dx) * 0.5, 50);
            const cp2x = endX - Math.max(Math.abs(dx) * 0.5, 50);
            path.setAttribute("d", `M ${startX} ${startY} C ${cp1x} ${startY} ${cp2x} ${endY} ${endX} ${endY}`);
        });
    }

    _updateConnectionPaths(connectionsLayer) {
        connectionsLayer.parentElement.querySelectorAll(".ws-node").forEach((node) => {
            this._updateConnectionsForNode(node, connectionsLayer);
        });
    }

    _recalculateAllConnections() {
        if (!this.currentNodeData) {
            return;
        }

        this.currentNodeData.connections.forEach((connection) => {
            const existingElement = this.currentNodeData.connectionsLayer.querySelector(`[data-connection-id="${connection.source}-${connection.target}"]`);

            if (existingElement) {
                existingElement.remove();
            }

            const newElement = this._createConnectionElement(connection, this.currentNodeData.positions);

            if (newElement) {
                this.currentNodeData.connectionsLayer.appendChild(newElement);
            }
        });

        this._updateConnectionsVisibility();
    }

    dispose() {
        if (this.updateConnections) {
            window.removeEventListener("resize", this.updateConnections);
        }
    }
}

export { NodeGraph };
