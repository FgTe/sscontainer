import React, { createRef } from 'react'

import ScrollContext from './scroll_context'

import runAfterInteractive, { tasksRunAfterInteractive } from './run_after_interactive'
import getComputedStyle from '@@/common/lib/get_computed_style'
import Callback from '@@/common/lib/callback'
import passiveOption from './passive'

let { passive } = passiveOption
const passiveProps = ['onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel']
const passiveEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel']

let id = 0
export default class ScrollView extends React.Component {
    constructor(props) {
        super(props)
        this.id = id++
        this.init = this.init.bind(this)
        this.scrollTo = this.scrollTo.bind(this)
        this.scrollBox = createRef()
        this.prevTouch = null
        this.prevented = false
        this.eventHandle = {}
        this.rect = {
            scrollW: null,
            scrollH: null,
            clientW: null,
            clientH: null
        }
        this.initHandle = null
        this.anchors = {
            list: [],
            sort: {
                y: [],
                x: [],
                prevScroll: 0,
                focusedList: [],
                focusedIndex: -1,
                prevFocusedIndex: -1
            },
            startRecompute: -1,
            recomputeDelayID: -1,
            checkFocusDelayID: -1
        }
        this.anchorActions = {
            mountAnchor: this.mountAnchor,
            updateAnchor: this.updateAnchor,
            unmountAnchor: this.unmountAnchor,
            scrollTo: this.scrollTo
        }
        this.offsetOfScrollTo = {
            x: 0,
            y: 0
        }
        this.anchorResizing = false
        this.anchorResizeCallback = new Callback()
        this.state = {
            init: false
        }
    }
    componentDidMount () {
        this.bindEvent(this.props)
        if ( this.props.contain ) {
            this.scrollBox.current.addEventListener('touchstart', this.startHandle)
            this.scrollBox.current.addEventListener('touchend', this.endHandle)
        }
        this.initHandle = runAfterInteractive(this.init)
        this.forwardRef(this.scrollBox.current)
    }
    componentDidUpdate(prevProps) {
        this.props.updateToucheEvent && Eventthis.bindEvent(this.props, prevProps)
        if ( this.props.forwardedRef !== prevProps.forwardedRef ) {
            this.forwardRef(this.scrollBox.current)
        }
    }
    componentWillUnmount() {
        for (let event in this.eventHandle) {
            this.scrollBox.current.removeEventListener(event, this.eventHandle[event])
        }
        if ( !this.state.init ) {
            tasksRunAfterInteractive.remove(this.initHandle)
        }
        if ( this.anchors.recomputeDelayID > 0 ) {
            clearTimeout(this.anchors.recomputeDelayID)
        }
        this.forwardRef(null)
    }
    // log (...log) {
    //     if ( this.props.log ) {
    //         if ( document.getElementById('J-log') ) {
    //             document.getElementById('J-log').innerHTML = JSON.stringify(log)
    //         } else {
    //             let div = document.createElement('div')
    //             div.id = 'J-log'
    //             div.style.cssText = 'position: fixed; z-index: 1000; top: 0; left: 0; font-size: 24px; color: #fff; background: #000;'
    //             document.body.append(div);
    //             div.innerHTML = JSON.stringify(log)
    //         }
    //     }
    // }
    init () {
        this.setState({
            init: true
        })
    }
    forwardRef (element) {
        if ( this.props.forwardedRef ) {
            if ( this.props.forwardedRef instanceof Function ) {
                this.props.forwardedRef(this.scrollBox.current)
            } else if ( this.props.forwardedRef.hasOwnProperty('current') ) {
                this.props.forwardedRef.current = this.scrollBox.current
            }
        }
    }
    computeAnchorRect (element, boundElement, deep) {
        let offsetParent = element.offsetParent
        let x = 0
        let y = 0
        switch ( offsetParent ) {
            case boundElement:
                x = element.offsetLeft
                y = element.offsetTop
                break
            case boundElement.offsetParent:
                let boundEleStyle = getComputedStyle(boundElement)
                let boundOffsetTop = boundElement.offsetTop + +boundEleStyle.borderTopWidth.replace(/[\D.]/g, '')
                let boundOffsetLeft = boundElement.offsetLeft + +boundEleStyle.borderLeftWidth.replace(/[\D.]/g, '')
                x = element.offsetLeft - boundOffsetLeft
                y = element.offsetTop - boundOffsetTop
                break
            default:
                let parentOffset = this.computeAnchorRect(offsetParent, boundElement, ( deep || 0 ) + 1)
                x = element.offsetLeft + parentOffset.x
                y = element.offsetTop + parentOffset.y
                break
        }
        return {
            x,
            y,
            x2: x + element.offsetWidth,
            y2: y + element.offsetHeight
        }
    }
    sortAnchor (anchorIndex, rect, sort, axis) {
        let i = sort.length - 1
        do {
            if ( i === -1 || this.anchors.list[sort[i]].rect[axis] <= rect[axis] ) {
                sort.splice(i + 1, 0, anchorIndex)
                break
            }
            i--
        } while ( i >= -1 )
    }
    mountAnchor = (anchor) => {
        let insert = {
            component: anchor
        }
        let index = this.anchors.list.push(insert) - 1
        this.setRecomputeAnchorPositionAction(index)
    }
    updateAnchor = (anchor) => {
        let index = this.anchors.list.findIndex((item) => item.component === anchor)
        if ( ~index ) {
            this.setRecomputeAnchorPositionAction(index)
        }
    }
    unmountAnchor = (anchor) => {
        let index = this.anchors.list.findIndex((item) => item.component === anchor)
        if ( ~index ) {
            this.anchors.list.splice(index, 1)
            this.setRecomputeAnchorPositionAction(index)
        }
    }
    setRecomputeAnchorPositionAction (mutationIndex) {
        this.anchorResizing = true
        if ( this.anchors.sort.x.length > 0 ) {
            this.anchors.sort.x = []
        }
        if ( this.anchors.sort.y.length > 0 ) {
            this.anchors.sort.y = []
        }
        if ( this.anchors.startRecomputeIndex < 0 || this.anchors.startRecomputeIndex > mutationIndex ) {
            this.anchors.startRecomputeIndex = mutationIndex
        }
        if ( this.anchors.recomputeDelayID > 0 ) {
            clearTimeout(this.anchors.recomputeDelayID)
        }
        this.anchors.recomputeDelayID = setTimeout(() => {
            this.computeAnchorPosition()
            this.anchorResizing = false
            this.anchorResizeCallback.invoke()
        })
    }
    computeAnchorPosition = () => {
        let list = this.anchors.list
        for ( let i = 0; i < list.length; i++ ) {
            if ( this.props.asyncAnchorInsert || i >= this.anchors.startRecompute ) {
                list[i].rect = this.computeAnchorRect(list[i].component.elementRef.current, this.scrollBox.current)
            }
            this.sortAnchor(i, list[i].rect, this.anchors.sort.y, 'y')
            this.sortAnchor(i, list[i].rect, this.anchors.sort.x, 'x')
        }
        this.anchors.recomputeDelayID = -1
        this.checkShowedAnchors()
    }
    checkShowedAnchors = () => {
        // console.log(this.props.id, this.anchors)
        if ( this.anchors.list.length > 0 ) {
            let top = this.scrollBox.current.scrollTop
            let clientH = this.scrollBox.current.clientHeight
            let bottom = top + clientH
            let scrollH = this.scrollBox.current.scrollHeight - clientH
            let focusedY = scrollH ? top * ( 1 + clientH / scrollH ) : 0
            let left = this.scrollBox.current.scrollLeft
            let clientW = this.scrollBox.current.clientWidth
            let right = left + clientW
            let scrollW = this.scrollBox.current.scrollWidth - clientW
            let focusedX = scrollW ? left * ( 1 + clientW / scrollW ) : 0
            let list = this.anchors.list
            let sort = null
            let flow = true
            let hadAnchorShowed = false
            let focusedIndex = -1
            let focusedList = []
            let anchorShowed = (anchor, index) => {
                // console.log(
                //     this.props.id,
                //     { left, right, top, bottom },
                //     { focusedX, focusedY },
                //     anchor.rect,
                //     anchor.rect.x2 >= left && anchor.rect.x < right && anchor.rect.y2 >= top && anchor.rect.y < bottom,
                //     focusedX >= anchor.rect.x && focusedX <= anchor.rect.x2 && focusedY >= anchor.rect.y && focusedY <= anchor.rect.y2,
                // )
                if ( anchor.rect.x2 >= left && anchor.rect.x < right && anchor.rect.y2 >= top && anchor.rect.y < bottom ) {
                    if ( focusedX >= anchor.rect.x && focusedX <= anchor.rect.x2 && focusedY >= anchor.rect.y && focusedY <= anchor.rect.y2 ) {
                        focusedIndex = index
                        focusedList.push(index)
                    }
                    anchor.component.showHandle()
                    return true
                } else {
                    return false
                }
            }
            if ( scrollH > scrollW ) {
                sort = this.anchors.sort.y
                flow = this.anchors.sort.prevScroll - top < 0
                this.anchors.sort.prevScroll = top
            } else {
                sort = this.anchors.sort.x
                flow = this.anchors.sort.prevScroll - left < 0
                this.anchors.sort.prevScroll = left
            }
            if ( sort.length ) {
                if ( this.anchors.sort.prevFocusedIndex >= 0 ) {
                    let rise = this.anchors.sort.prevFocusedIndex 
                    let down = this.anchors.sort.prevFocusedIndex - 1
                    do {
                        if ( --rise >= 0 ) {
                            if ( anchorShowed(list[sort[rise]], rise) ) {
                                hadAnchorShowed = true
                            } else if ( flow || hadAnchorShowed ) {
                                rise = -1
                            }
                        }
                        if ( ++down < sort.length ) {
                            if ( anchorShowed(list[sort[down]], down) ) {
                                hadAnchorShowed = true
                            } else if ( !flow || hadAnchorShowed ) {
                                down = sort.length
                            }
                        }
                    } while ( rise >= 0 || down < sort.length )
                } else {
                    let i = 0
                    do {
                        if ( anchorShowed(list[sort[i]], i) ) {
                            hadAnchorShowed = true
                        } else if ( hadAnchorShowed ) {
                            break
                        }
                        i++
                    } while ( i < sort.length )
                }
                if ( this.anchors.sort.focusedIndex >= 0 && this.anchors.sort.focusedIndex !== focusedIndex ) {
                    list[sort[this.anchors.sort.focusedIndex]].component.unfocusHandle()
                }
                // console.log(this.props.id, focusedIndex)
                if ( focusedIndex >= 0 ) {
                    if ( flow ? this.anchors.sort.prevFocusedIndex < focusedIndex : this.anchors.sort.prevFocusedIndex > focusedIndex ) {
                        this.anchors.sort.prevFocusedIndex = focusedIndex
                    }
                    list[sort[focusedIndex]].component.focusHandle()
                }
                this.anchors.sort.focusedIndex = focusedIndex
            }
        }
        this.anchors.checkFocusDelayID = -1
    }
    scrollHandle = (event) => {
        if ( this.props.watchAnchor ) {
            if ( this.anchors.checkFocusDelayID >= 0 ) {
                clearTimeout(this.anchors.checkFocusDelayID)
            }
            this.anchors.checkFocusDelayID = setTimeout(this.checkShowedAnchors, 100)
        }
        if ( this.props.onScroll instanceof Function ) {
            this.props.onScroll(event)
        }
    }
    setOffsetOfScrollTo = ({ x = 0, y = 0 }) => {
        this.offsetOfScrollTo = { x, y }
    }
    scrollTo (id) {
        const handle = () => {
            let list = this.anchors.list
            for ( let i = list.length - 1; i >= 0; i-- ) {
                if ( list[i].component.props.id === id ) {
                    const target = {
                        y: list[i].rect.y,
                        x: list[i].rect.x
                    }
                    this.scrollBox.current.scrollTo(
                        target.x + this.offsetOfScrollTo.x,
                        target.y + this.offsetOfScrollTo.y
                    )
                    break
                }
            }
        }
        if ( this.anchorResizing ) {
            this.anchorResizeCallback.once(handle)
        } else {
            handle()
        }
    }
    startHandle = (event) => {
        this.rect.scrollW = this.scrollBox.current.scrollWidth
        this.rect.scrollH = this.scrollBox.current.scrollHeight
        this.rect.clientW = this.scrollBox.current.clientWidth
        this.rect.clientH = this.scrollBox.current.clientHeight
        this.rect.scrollT = this.scrollBox.current.scrollTop
        this.rect.scrollL = this.scrollBox.current.scrollLeft
        this.rect.topEdge = this.rect.scrollH - this.rect.clientH
        this.rect.leftEdge = this.rect.scrollW - this.rect.clientW
        if ( this.rect.scrollT === 0 || this.rect.scrollT === this.rect.topEdge || this.rect.scrollL === 0 || this.rect.scrollL === this.rect.leftEdge ) {
            let touch = event.touches[0]
            this.prevTouch = {
                id: touch.identifier,
                y: touch.clientY,
                x: touch.clientX
            }
            this.prevented = false
            this.scrollBox.current.addEventListener('touchmove', this.moveHandle)
        } else {
            this.prevented = false
        }
    }
    moveHandle = (event) => {
        let touch = event.touches[0]
        if ( this.prevTouch && this.prevTouch.id === touch.identifier ) {
            let y = this.prevTouch.y - touch.clientY
            let x = this.prevTouch.x - touch.clientX
            let horizontalPrevent = this.rect.scrollW - this.rect.clientW <= 0 || x < -2 && this.rect.scrollL <= 0 || x > 2 && Math.abs(this.rect.scrollL - this.rect.leftEdge) < 2
            let verticalPrevent = this.rect.scrollH - this.rect.clientH <= 0 || y < -2 && this.rect.scrollT <= 0 || y > 2 && Math.abs(this.rect.scrollT - this.rect.topEdge) < 2
            this.prevented = horizontalPrevent && verticalPrevent
            if ( this.prevented ) {
                event.preventDefault()
                this.prevTouch.id = touch.identifier
                this.prevTouch.y = touch.clientY
                this.prevTouch.x = touch.clientX
            } else {
                this.prevented = false
                this.prevTouch = null
                this.scrollBox.current.removeEventListener('touchmove', this.moveHandle)
            }
        } else {
            this.prevTouch = {
                id: touch.identifier,
                y: touch.clientY,
                x: touch.clientX
            }
        }
    }
    endHandle = (event) => {
        if ( this.prevented ) {
            this.scrollBox.current.removeEventListener('touchmove', this.moveHandle)
        }
        this.prevTouch = null
    }
    bindEvent(now, prev) {
        for ( let i = passiveEvents.length - 1; i >= 0; i-- ) {
            let event = passiveEvents[i]
            let prop = passiveProps[i]
            if (now[prop] instanceof Function) {
                if (!prev || now[prop] !== prev[prop]) {
                    if (this.eventHandle[event]) {
                        this.scrollBox.current.removeEventListener(event, this.eventHandle[event])
                    }
                    this.eventHandle[event] = now[prop]
                    this.scrollBox.current.addEventListener(event, this.eventHandle[event], passive)
                }
            } else if (this.eventHandle[event]) {
                this.scrollBox.current.removeEventListener(event, this.eventHandle[event])
                delete this.eventHandle[event]
            }
        }
    }
    render() {
        let { log, forwardedRef, contain, asyncAnchorInsert, watchAnchor, updateToucheEvent, className, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, onScroll, ...rest } = this.props
        return (
            <ScrollContext.Provider value={this.anchorActions}>
                <div data-style-container ref={this.scrollBox} onScroll={this.scrollHandle}
                    className={`${this.state.init ? 'container-scrollable' : 'container-scrollable-z-uninit'}${ contain ? ' f-contain' : ''}${className ? ` ${className}` : ''}`}
                    {...rest}
                />
            </ScrollContext.Provider>
        )
    }
}