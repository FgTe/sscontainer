import React, { createRef } from 'react'

import passive from './passive'

let { impassive } = passive

export default class NonScrollView extends React.Component {
    constructor(props) {
        super(props)
        this.box = createRef()
        this.handle = (event) => event.preventDefault()
    }
    componentDidMount() {
        if (this.props.onTouchMove instanceof Function) {
            this.handle = (event) => {
                event.preventDefault()
                this.props.onTouchMove(event)
            }
        }
        this.box.current.addEventListener('touchmove', this.handle, impassive)
        this.forwardRef(this.box.current)
    }
    componentDidUpdate(prevProps) {
        this.bindEvent(this.props.onTouchMove, prevProps.onTouchMove)
        if ( this.props.forwardedRef !== prevProps.forwardedRef ) {
            this.forwardRef(this.box.current)
        }
    }
    componentWillUnmount() {
        if (this.handle) {
            this.box.current.removeEventListener('touchmove', this.handle)
        }
        this.forwardRef(null)
    }
    forwardRef (element) {
        if ( this.props.forwardedRef ) {
            if ( this.props.forwardedRef instanceof Function ) {
                this.props.forwardedRef(element)
            } else if ( this.props.forwardedRef.hasOwnProperty('current') ) {
                this.props.forwardedRef.current = element
            }
        }
    }
    bindEvent(now, prev) {
        if (now instanceof Function) {
            if (!prev || now !== prev) {
                this.box.current.removeEventListener('touchmove', this.handle)
                this.handle = (event) => {
                    event.preventDefault()
                    now(event)
                }
                this.box.current.addEventListener('touchmove', this.handle, impassive)
            }
        } else if (prev instanceof Function) {
            this.box.current.removeEventListener('touchmove', this.handle)
            this.handle = (event) => event.preventDefault()
            this.box.current.addEventListener('touchmove', this.handle, impassive)
        }
    }
    render() {
        let { forwardedRef, onTouchMove, ...rest } = this.props
        return <div ref={this.box} {...rest} data-style-container/>
    }
}