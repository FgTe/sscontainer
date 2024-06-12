import { createContext } from 'react'

export default createContext({
    mountAnchor (anchor) {},
    unmountAnchor (anchor) {},
    updateAnchor (anchor) {},
    scrollTo () {}
})