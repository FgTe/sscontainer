import React from 'react'

import passiveOption from './passive'

let { passive } = passiveOption
const passiveProps = ['onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel']
const passiveEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel']

class ScrollView extends React.Component {
    constructor(props) {
        super(props)
        this.forwardedRef = this.forwardedRef.bind(this)
        this.startHandle = this.startHandle.bind(this)
        this.scrollBox = null
        this.eventHandle = {}
    }
    componentDidMount() {
        this.bindEvent(this.props)
        if ( this.props.contain ) {
            this.scrollBox.addEventListener('touchstart', this.startHandle)
        }
    }
    componentDidUpdate(prevProps) {
        this.props.updateToucheEvent && Eventthis.bindEvent(this.props, prevProps)
    }
    componentWillUnmount() {
        this.scrollBox.removeEventListener('touchstart', this.startHandle)
        for (let event in this.eventHandle) {
            this.scrollBox.removeEventListener(event, this.eventHandle[event])
        }
    }
    startHandle (event) {
        let scrollW = this.scrollBox.scrollWidth
        let scrollH = this.scrollBox.scrollHeight
        let clientW = this.scrollBox.clientWidth
        let clientH = this.scrollBox.clientHeight
        let scrollT = this.scrollBox.scrollTop
        let scrollL = this.scrollBox.scrollLeft
        let topEdge = scrollH - clientH
        let leftEdge = scrollW - clientW
        if ( scrollW <= clientW && scrollH <= clientH ) {
            event.preventDefault()
        } else {
            if ( scrollT === 0 ) {
                this.scrollBox.scrollTop = 1
            } else if ( scrollT === topEdge ) {
                this.scrollBox.scrollTop = topEdge - 1
            }
            if ( scrollL === 0 ) {
                this.scrollBox.scrollLeft = 1
            } else if ( scrollL === leftEdge ) {
                this.scrollBox.scollLeft = leftEdge - 1
            }
        }
    }
    forwardedRef(element) {
        this.scrollBox = element
        this.props.forwardedRef && ( this.props.forwardedRef.current = element )
    }
    bindEvent(now, prev) {
        for (let i = 0; i < passiveEvents.length; i++) {
            let event = passiveEvents[i]
            let prop = passiveProps[i]
            if (now[prop] instanceof Function) {
                if (!prev || now[prop] !== prev[prop]) {
                    if (this.eventHandle[event]) {
                        this.scrollBox.removeEventListener(event, this.eventHandle[event])
                    }
                    this.eventHandle[event] = now[prop]
                    this.scrollBox.addEventListener(event, this.eventHandle[event], passive)
                }
            } else if (this.eventHandle[event]) {
                this.scrollBox.removeEventListener(event, this.eventHandle[event])
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
        return <div ref={this.forwardedRef} className={`'scrollable'${className ? ` ${className}` : ''}`} {...rest} data-style-container/>
    }
}

export default React.forwardRef((props, ref) => {
    return <ScrollView forwardedRef={ref} {...props}/>
})