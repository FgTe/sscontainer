import React from 'react'

import ContainerContext from './container_context'

import _NonScrollView from './non_scroll_view'
import _ModalPortal from './modal_portal'
import _ScrollView from './scroll_view'
import _Anchor from './anchor'

import runAfterInteractive, { tasksRunAfterInteractive } from './run_after_interactive'

import './container.scss'


export function setupDocumentScrollElement() {
    let scroll = document.scrollingElement
}
export function setupBody() {
    let body = document.body
    runAfterInteractive(() => {
        body.style.cssText = 'position: fixed; overflow: hidden; top: 0; right: 0; bottom: 0; left: 0; margin: 0 0; padding: 0 0; width: 100%; height: 100%;'
    })
}

export default class Container extends React.Component {
    constructor (props) {
        super(props)
        this.init = this.init.bind(this)
        this.getModalMountPoint = this.getModalMountPoint.bind(this)
        this.initHandle = null
        this.state = {
            init: false,
            modalMountPoint: null
        }
    }
    componentDidMount () {
        this.initHandle = runAfterInteractive(this.init)
    }
    componentWillUnmount () {
        if ( !this.state.init ) {
            tasksRunAfterInteractive.remove(this.initHandle)
        }
    }
    init () {
        this.setState({
            init: true
        })
    }
    getModalMountPoint (element) {
        if ( this.state.modalMountPoint !== element ) {
            this.setState({
                modalMountPoint: element
            })
        }
    }
    renderContent() {
        return this.props.renderContent ? this.props.renderContent() : null
    }
    renderModal() {
        return this.props.renderModal ? this.props.renderModal() : null
    }
    render() {
        return (
            <ContainerContext.Provider value={this.state}>
                <div className={this.state.init ? 'container' : ''} data-style-container>
                    <div className={this.state.init ? this.props.scrollable ? 'container-content container-scrollable' : 'container-content' : ''} data-style-container>{this.renderContent()}</div>
                    {this.state.init ? (
                        <div ref={this.getModalMountPoint} className="container-modal" data-style-container>{this.renderModal()}</div>
                    ) : null}
                </div>
            </ContainerContext.Provider>
        )
    }
}

export let ScrollView = _ScrollView
export let NonScrollView = _NonScrollView
export let ModalPortal = _ModalPortal
export let Anchor = _Anchor