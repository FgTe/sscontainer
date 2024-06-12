import React from 'react'
import ReactDOM from 'react-dom'

import ContainerContext from './container_context'

export default class ModalPortal extends React.Component {
    static contextType = ContainerContext
    constructor (props) {
        super(props)
        this.mountModal = this.mountModal.bind(this)
        this.portal = document.createElement('div')
        this.portal.className = `container-modal-portal${this.props.className ? ` ${this.props.className}` : ''}`
        this.portal.setAttribute('data-style-container', '')
        this.modalMountPoint = null
    }
    componentWillUnmount () {
        if ( this.modalMountPoint ) {
            this.modalMountPoint.removeChild(this.portal)
        }
    }
    mountModal (context) {
        if ( context.modalMountPoint !== this.modalMountPoint ) {
            if ( this.modalMountPoint ) {
                this.modalMountPoint.removeChild(this.portal)
            }
            if ( context.modalMountPoint ) {
                this.modalMountPoint = context.modalMountPoint
                this.modalMountPoint.appendChild(this.portal)
            }
        }
        return ReactDOM.createPortal(this.props.children, this.portal)
    }
    render () {
        return (
            <ContainerContext.Consumer>
                {this.mountModal}
            </ContainerContext.Consumer>
        )
    }
}