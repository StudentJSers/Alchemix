let playground = (async () => {
    enum playgroundEventType {
        DRAGSTART,
        DRAG,
        DRAGEND
    }
    interface Position {
        x: number;
        y: number;
    }
    interface Item {
        X: number;
        Y: number;
        id: string;
        type: string;
    }
    interface Playground {
        el: Node;
        events: Map<playgroundEventType, Function>;
        init: Function;
        addEventListener: Function;
        selectedElement: Node | null;
        getMousePosition: Function;
        offset: Position;
        confins: {
            minX: number;
            maxX: number;
            minY: number;
            maxY: number;
        },
        transform: SVGTransform | null;
        assetDatas: {
            base: any;
            names: any;
            assets: any;
            baseAsset: any;
        };
        itemData: Map<string, Item>;
        progress: any;
        createItem: Function;
        createItemByViewName: Function;
        isCoalescenced: boolean;
        coalescencedItems: Array<string>;
        lastCoalescencedElement: any;
    }
    interface ItemData {
        id: string;
        parents?: string[][];
        isBasic?: boolean;
        pathType: 'inline' | 'url';
        path: string;
        viewName: string;
    }

    document.addEventListener('AlchemixDatasetLoaded', () => {
        if(!document.querySelector('.curtain')) return;
        (<HTMLHtmlElement> document.querySelector('.curtain')).style.setProperty('display','none');
    });

    if (!localStorage.getItem('AlchemixCurrentUserProgress')) localStorage.setItem('AlchemixCurrentUserProgress', JSON.stringify({}));

    const GUID: Function = (): string => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16).toUpperCase();
        });
    };

    const postData = (url: string, data: any, type: 'json' | 'text') => {
        return fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow',
            referrer: 'no-referrer',
            body: JSON.stringify(data),
        })
        .then(response => response[type]());
    }

    const getData = (url: string, type: 'json' | 'text') => {
        return fetch(url).then(res => res[type]());
    }

    const playground: Playground = {
        el: <Node> document.querySelector('#playground'),
        events: new Map<playgroundEventType, EventListener>(),
        init: (): void => {
            playground.el.addEventListener('touchmove', <EventListener> playground.events.get(playgroundEventType.DRAG));
            playground.el.addEventListener('touchdrag', <EventListener> playground.events.get(playgroundEventType.DRAG));
            playground.el.addEventListener('touchend', <EventListener> playground.events.get(playgroundEventType.DRAGEND));
            playground.el.addEventListener('touchleave', <EventListener> playground.events.get(playgroundEventType.DRAGEND));
            playground.el.addEventListener('touchcancel', <EventListener> playground.events.get(playgroundEventType.DRAGEND));
            playground.el.addEventListener('mousedown', <EventListener> playground.events.get(playgroundEventType.DRAGSTART));
            playground.el.addEventListener('mousemove', <EventListener> playground.events.get(playgroundEventType.DRAG));
            playground.el.addEventListener('mouseup', <EventListener> playground.events.get(playgroundEventType.DRAGEND));
            playground.el.addEventListener('mouseleave', <EventListener> playground.events.get(playgroundEventType.DRAGEND));
            playground.el.addEventListener('touchstart', <EventListener> playground.events.get(playgroundEventType.DRAGSTART));
        },
        addEventListener: (name: playgroundEventType, listener: EventListener): void => {
            playground.events.set(name, listener);
        },
        selectedElement: null,
        getMousePosition: (e: MouseEvent): Position => {
            const CTM = (playground.el as SVGGraphicsElement).getScreenCTM();
            if(!CTM) throw new TypeError();
            if((e as any).targetTouches) { e = (e as any).targetTouches[0]; }
            return <Position> {
                x: (e.clientX - CTM.e) / CTM.a,
                y: (e.clientY - CTM.f) / CTM.d
            }
        },
        offset: {
            x: 0,
            y: 0
        },
        confins: {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0,
        },
        transform: null,
        assetDatas: {
            base: await getData('/datasetAPI/defaultDataset/base', 'json'),
            names: await getData('/datasetAPI/defaultDataset/name', 'json'),
            baseAsset: await getData('/datasetAPI/dataset/RDc4RjRCMEItNjQyQi00NENFLUEyRTctN0E0MjUwRThFNUI3.MDAxOTlDMjEwMjREOEMwMA%3D%3D', 'json'),
            assets: {}
        },
        itemData: new Map<string, Item>(),
        progress: JSON.parse(<string> localStorage.getItem('AlchemixCurrentUserProgress')),
        createItem: (type: string, x?: number, y?: number) => {
            if(!playground.assetDatas.baseAsset.datas.map((l: any) => l.id).includes(type)) throw new Error();
            if(x != undefined && y != undefined) {
                const gnode: Element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                gnode.classList.add('item');
                gnode.classList.add('draggable');
                let id = GUID();
                gnode.setAttributeNS(null, 'id', `item_${id}`);
                playground.itemData.set(id, {
                    X: x,
                    Y: y,
                    type: type,
                    id: id
                });
                const snode: Element = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                snode.setAttributeNS(null, 'href', playground.assetDatas.baseAsset.datas.find((l: any) => l.id == type).path);
                snode.setAttributeNS(null, 'width', '100px');
                snode.setAttributeNS(null, 'height', '100px');
                gnode.appendChild(snode);
                playground.el.appendChild(gnode);
                gnode.setAttributeNS(null, 'transform', `translate(${x} ${y})`);
            } else {
                const gnode: Element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                gnode.classList.add('item');
                gnode.classList.add('draggable');
                let id = GUID();
                gnode.setAttributeNS(null, 'id', `item_${id}`);
                playground.itemData.set(id, {
                    X: 0,
                    Y: 0,
                    type: type,
                    id: id
                });
                const snode: Element = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                snode.setAttributeNS(null, 'href', playground.assetDatas.baseAsset.datas.find((l: any) => l.id == type).path);
                snode.setAttributeNS(null, 'width', '100px');
                snode.setAttributeNS(null, 'height', '100px');
                gnode.appendChild(snode);
                gnode.setAttributeNS(null, 'transform', `translate(0 0)`);
                playground.el.appendChild(gnode);
            }
        },
        createItemByViewName(viewName: string, x?: number, y?: number) {
            if(!playground.assetDatas.baseAsset.datas.map((l: any) => l.viewName).includes(viewName)) throw new Error();
            if(x != undefined && y != undefined) {
                const gnode: Element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                gnode.classList.add('item');
                gnode.classList.add('draggable');
                let id = GUID();
                gnode.setAttributeNS(null, 'id', `item_${id}`);
                playground.itemData.set(id, {
                    X: x,
                    Y: y,
                    type: playground.assetDatas.baseAsset.datas.find((l: any) => l.viewName == viewName).id,
                    id: id
                });
                const snode: Element = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                snode.setAttributeNS(null, 'href', playground.assetDatas.baseAsset.datas.find((l: any) => l.viewName == viewName).path);
                snode.setAttributeNS(null, 'width', '100px');
                snode.setAttributeNS(null, 'height', '100px');
                gnode.appendChild(snode);
                gnode.setAttributeNS(null, 'transform', `translate(${x} ${y})`);
                playground.el.appendChild(gnode);
            } else {
                const gnode: Element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                gnode.classList.add('item');
                gnode.classList.add('draggable');
                let id = GUID();
                gnode.setAttributeNS(null, 'id', `item_${id}`);
                playground.itemData.set(id, {
                    X: 0,
                    Y: 0,
                    type: playground.assetDatas.baseAsset.datas.find((l: any) => l.viewName == viewName).id,
                    id: id
                });
                const snode: Element = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                snode.setAttributeNS(null, 'href', playground.assetDatas.baseAsset.datas.find((l: any) => l.viewName == viewName).path);
                snode.setAttributeNS(null, 'width', '100px');
                snode.setAttributeNS(null, 'height', '100px');
                gnode.appendChild(snode);
                gnode.setAttributeNS(null, 'transform', `translate(0 0)`);
                playground.el.appendChild(gnode);
            }
        },
        isCoalescenced: false,
        coalescencedItems: [],
        lastCoalescencedElement: null
    };

    document.dispatchEvent(new CustomEvent('AlchemixDatasetLoaded'));

    playground.addEventListener(playgroundEventType.DRAGSTART, (e: MouseEvent | TouchEvent): void => {
        if ((e.target as Element).tagName.toLowerCase() == 'svg') return;
        const target: Element | null = (e.target as Element).closest('.item');
        if (!target) return;
        if (!target.classList.contains('draggable')) return;
        playground.selectedElement = <Node> target;
        const unode = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        unode.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${target.id}`);
        unode.classList.add('unodeZIndexElement');
        playground.el.appendChild(unode);
        let transforms = (playground.selectedElement as SVGGraphicsElement).transform.baseVal;
        if (transforms.numberOfItems === 0 ||
            transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
            const translate = (playground.el as SVGSVGElement).createSVGTransform();
            translate.setTranslate(0, 0);
            (playground.selectedElement as SVGGraphicsElement).transform.baseVal.insertItemBefore(translate, 0);
        }
        playground.transform = transforms.getItem(0);
        playground.offset = playground.getMousePosition(e);
        playground.offset.x -= playground.transform.matrix.e;
        playground.offset.y -= playground.transform.matrix.f;
        const bbox: SVGRect = (playground.selectedElement as SVGGraphicsElement).getBBox();
        playground.confins = {
            minX: 0 - bbox.x,
            maxX: (playground.el as Element).getBoundingClientRect().width - bbox.x - bbox.width,
            minY: 0 - bbox.y,
            maxY: (playground.el as Element).getBoundingClientRect().height - bbox.y - bbox.height,
        };
    });

    playground.addEventListener(playgroundEventType.DRAG, (e: MouseEvent | TouchEvent) => {
        if(!playground.selectedElement) return;
        const coord: Position = playground.getMousePosition(e);
        coord.x -= playground.offset.x;
        coord.y -= playground.offset.y;
        if(coord.x < playground.confins.minX) coord.x = playground.confins.minX;
        if(coord.x > playground.confins.maxX) coord.x = playground.confins.maxX;
        if(coord.y < playground.confins.minY) coord.y = playground.confins.minY;
        if(coord.y > playground.confins.maxY) coord.y = playground.confins.maxY;
        const elemId: string = <string> (<Element> playground.selectedElement).getAttributeNS(null, 'id')?.replace('item_', '');
        const item_: Item = <Item> playground.itemData.get(elemId);
        item_.X = coord.x;
        item_.Y = coord.y;
        let c: number = 0;
        let c_: number = 0;
        playground.itemData.forEach((item: Item): void => {
            if(c != 0) return;
            if(item.id == item_.id) return;
            console.log(item.id, playground.lastCoalescencedElement);
            if(document.querySelector('.itemCoalescenceHighlight')) return;
            if(!(item.X < item_.X + 70 && item.X > item_.X - 70) || !(item.Y < item_.Y + 70 && item.Y > item_.Y - 70)) {
                playground.coalescencedItems = [];
                playground.isCoalescenced = false;
                return;
            }
            c++;
            playground.isCoalescenced = true;
            const fnode = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
            fnode.setAttributeNS(null, 'class', 'itemCoalescenceHighlight');
            fnode.setAttributeNS(null, 'width', '120px');
            fnode.setAttributeNS(null, 'height', '120px');
            fnode.setAttributeNS(null, 'x', (item.X - 10).toString());
            fnode.setAttributeNS(null, 'y', (item.Y - 10).toString());
            const dnode = document.createElement('div');
            dnode.style.setProperty('width', '120px');
            dnode.style.setProperty('height', '120px');
            dnode.style.setProperty('background', 'black');
            dnode.style.setProperty('border-radius', '100%');
            dnode.style.setProperty('transform-origin', 'center');
            dnode.style.setProperty('opacity', '0.4');
            dnode.setAttribute('class', 'itemCoalescenceHighlightInnerDiv');
            fnode.appendChild(dnode);
            playground.el.insertBefore(fnode, playground.el.firstChild);
            playground.coalescencedItems.push(item.id);
            playground.coalescencedItems.push(item_.id);
            if(item.id != playground.lastCoalescencedElement) document.querySelector('.itemCoalescenceHighlightInnerDiv')?.animate([
                { transform: 'scale(0)' }, 
                { transform: 'scale(1)' }
            ], { 
                duration: 100,
                iterations: 1
            });
            playground.lastCoalescencedElement = item.id;
        });
        playground.itemData.forEach((item: Item) => {
            if(item.id == item_.id) return;
            if(!(item.X < item_.X + 70 && item.X > item_.X - 70) || !(item.Y < item_.Y + 70 && item.Y > item_.Y - 70)) c_++;
        });
        if(c_ >= playground.itemData.size - 1) {
            (<Element> document.querySelector('.itemCoalescenceHighlight'))?.remove();
        }
        if(playground.transform) playground.transform.setTranslate(coord.x, coord.y);
        e.preventDefault();
    });
    
    playground.addEventListener(playgroundEventType.DRAGEND, (e: MouseEvent): void => {
        if(!playground.selectedElement) return;
        const temp = playground.selectedElement.cloneNode(true);
        playground.el.appendChild(temp);
        (<Element> playground.selectedElement).remove();
        playground.selectedElement = null;
        (<Element> document.querySelector('.itemCoalescenceHighlight'))?.remove();
        (<Element> document.querySelector('.unodeZIndexElement'))?.remove();
        if(playground.isCoalescenced) {
            const i0: Item = <Item> playground.itemData.get(playground.coalescencedItems[0]); // coalescence item
            const i1: Item = <Item> playground.itemData.get(playground.coalescencedItems[1]); // dragging item
            if(!i0 || !i1) throw new Error();
            const i0d: ItemData = <ItemData> playground.assetDatas.baseAsset.datas.find((l: ItemData) => l.id == i0.type);
            const i1d: ItemData = <ItemData> playground.assetDatas.baseAsset.datas.find((l: ItemData) => l.id == i1.type);
            if(!i0d || !i1d) throw new Error();
            const findedItemData: ItemData = playground.assetDatas.baseAsset.datas.find((l: ItemData) => {
                return l.parents ? l.parents.some((l_: string[]) => {
                    return (l_[0] == i0d.id && l_[1] == i1d.id) || (l_[1] == i0d.id && l_[0] == i1d.id)
                }) : false;
            });
            if(!findedItemData) {
                console.log(`Invalid Combination: ${i0d.viewName} + ${i1d.viewName}`); // 없는 조합을 만들었을 경우
                (async () => {
                    const i1t: { x: number, y: number } = {
                        x: parseFloat((<string> (<Element> document.querySelector(`#item_${i1.id}`)).getAttributeNS(null, 'transform')).replace('translate(', '').replace(/ [0-9\.]+\)/, '')),
                        y: parseFloat((<string> (<Element> document.querySelector(`#item_${i1.id}`)).getAttributeNS(null, 'transform')).replace(/translate\([0-9\.]+ /, '').replace(')', ''))
                    };
                    (<Element> document.querySelector(`#item_${i1.id}`)).animate([
                        { transform: `translate(${i1t.x + 5}px, ${i1t.y}px)` },
                        { transform: `translate(${i1t.x - 5}px, ${i1t.y}px)` },
                        { transform: `translate(${i1t.x + 5}px, ${i1t.y}px)` },
                        { transform: `translate(${i1t.x - 5}px, ${i1t.y}px)` }
                    ], {
                        duration: 200,
                        iterations: 1
                    });
                })();
            } else {
                console.log(`New Item Unlocked: ${i0d.viewName} + ${i1d.viewName} = ${findedItemData.viewName}`); // 새로운 아이템을 만듬
                // playground.itemData.delete(i0.id);
                // (<Element> playground.el).querySeletor('item' + i0.id).remove();
                // playground.itemData.delete(i1.id);
                // (<Element> playground.el).querySeletor('item' + i1.id).remove();
                let temp = Math.floor(Math.random() * 2);
                playground.createItemByViewName(findedItemData.viewName, temp == 0 ? i0.X + 30 : i1.X + 30, temp == 0 ? i0.Y - 30 : i1.Y - 30);
            }
            playground.coalescencedItems = [];
        }
    });
    
    playground.init();

    playground.createItemByViewName('fire', 0, 0); // temp
    return playground;
})();