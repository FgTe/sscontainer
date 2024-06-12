import React, { createRef } from 'react'

import ScrollContext from './scroll_context'

export default class Anchor extends React.Component {
    constructor (props) {
        super(props)
        this.finalRnder = this.finalRnder.bind(this)
        this.context = null
        this.elementRef = createRef()
        this.showed = false
        this.focused = false
    }
    componentDidMount () {
        this.forwardRef(this.elementRef.current)
        this.context.mountAnchor(this)
    }
    componentWillUnmount () {
        this.forwardRef(null)
        this.context.unmountAnchor(this)
    }
    componentDidUpdate (prevProps) {
        this.context.updateAnchor(this)
        if ( this.props.forwardedRef !== prevProps.forwardedRef ) {
            this.forwardRef(this.elementRef.current)
        }
    }
    focus() {
        this.context.scrollTo()
    }
    showHandle (...args) {
        if ( !this.showed && this.props.onShow instanceof Function ) {
            this.showed = true
            this.props.onShow(...args)
        }
    }
    focusHandle () {
        if ( !this.focused ) {
            this.focused = true
            if ( this.props.onFocus instanceof Function ) {
                this.props.onFocus()
            }
        }
    }
    unfocusHandle () {
        if ( this.focused ) {
            this.focused = false
            if ( this.props.onUnfocus instanceof Function ) {
                this.props.onUnfocus()
            }
        }
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
    finalRnder (contextValue) {
        let { inline, forwardedRef, onShow, onFocus, onUnfocus, ...rest } = this.props
        this.context = contextValue
        return inline ? (
            <span ref={this.elementRef} {...rest}/>
        ) : (
            <div ref={this.elementRef} {...rest}/>
        )
    }
    render () {
        return (
            <ScrollContext.Consumer>
                {this.finalRnder}
            </ScrollContext.Consumer>
        )
    }
}