import React, { createRef } from 'react'

import passiveOption from './passive'

let { passive } = passiveOption
const passiveProps = ['onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel']
const passiveEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel']

class ScrollView extends React.Component {
    constructor(props) {
        super(props)
        this.startHandle = this.startHandle.bind(this)
        this.scrollBox = null
        this.eventHandle = {}
    }
    componentDidMount() {
        this.bindEvent(this.props)
        if ( this.props.contain ) {
            this.scrollBox.current.addEventListener('touchstart', this.startHandle, passive)
        }
        if ( this.props.forwardedRef ) {
            if ( this.props.forwardedRef instanceof Function ) {
                this.props.forwardedRef(this.scrollBox.current)
            } else if ( this.props.forwardedRef.hasOwnProperty('current') ) {
                this.props.forwardedRef.current = this.scrollBox.current
            }
        }
    }
    componentDidUpdate(prevProps) {
        this.props.updateToucheEvent && Eventthis.bindEvent(this.props, prevProps)
    }
    componentWillUnmount() {
        this.scrollBox.current.removeEventListener('touchstart', this.startHandle)
        for (let event in this.eventHandle) {
            this.scrollBox.current.removeEventListener(event, this.eventHandle[event])
        }
    }
    startHandle (event) {
        let scrollW = this.scrollBox.current.scrollWidth
        let scrollH = this.scrollBox.current.scrollHeight
        let clientW = this.scrollBox.current.clientWidth
        let clientH = this.scrollBox.current.clientHeight
        let scrollT = this.scrollBox.current.scrollTop
        let scrollL = this.scrollBox.current.scrollLeft
        let topEdge = scrollH - clientH
        let leftEdge = scrollW - clientW
        if ( scrollW <= clientW && scrollH <= clientH ) {
            event.preventDefault()
        } else {
            if ( scrollT === 0 ) {
                this.scrollBox.current.scrollTop = 1
            } else if ( scrollT === topEdge ) {
                this.scrollBox.current.scrollTop = topEdge - 1
            }
            if ( scrollL === 0 ) {
                this.scrollBox.current.scrollLeft = 1
            } else if ( scrollL === leftEdge ) {
                this.scrollBox.current.scollLeft = leftEdge - 1
            }
        }
    }
    bindEvent(now, prev) {
        for (let i = 0; i < passiveEvents.length; i++) {
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
    touchStartHandle(event) {
        let current = event.currentTarget || this
        if (current.scrollHeight <= current.clientHeight) {
            event.preventDefault()
        }
    }
    render() {
        let { forwardedRef, contain, updateToucheEvent, forwardRef, className, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, ...rest } = this.props
        if ( forwardedRef ) {
            this.scrollBox = forwardedRef
        }
        if ( !this.scrollBox ) {
            this.scrollBox = createRef()
        }
        return <div ref={this.scrollBox} className={`container-scrollable${className ? ` ${className}` : ''}`} {...rest} data-style-container/>
    }
}

export default React.forwardRef((props, ref) => {
    return <ScrollView forwardedRef={ref} {...props}/>
})