import Callback from '@@/common/lib/callback'

let tasks = new Callback()
function runner () {
    if ( document.readyState === 'interactive' || document.readyState === 'complete' ) {
        setTimeout(() => { tasks.invoke() }, 300)
    }
}
function runAfterInteractive (task) {
    let handle = tasks.once(task)
    runner()
    return handle
}
document.addEventListener('readystatechange', runner)

export default runAfterInteractive
export let tasksRunAfterInteractive = tasks