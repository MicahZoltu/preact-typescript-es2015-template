import { createElement, render } from 'preact'
import { App, AppModel } from './App'
import { createOnChangeProxy } from './proxy'

// create our root model as a proxy object that will auto-rerender anytime its properties (recursively) change
const rootModel: AppModel = createOnChangeProxy<AppModel>(rerender, {
	cycleGreeting: () => rootModel.greeting = (rootModel.greeting === 'Hello') ? 'nuqneH' : 'Hello',
	greeting: 'Hello',
	subject: 'World',
})

// put the root model on the window for debugging convenience
declare global { interface Window { rootModel: AppModel } }
window.rootModel = rootModel

// specify our render function, which will be fired anytime rootModel is mutated
function rerender() {
	const element = createElement(App, rootModel)
	render(element, document.body)
}

// kick off the initial render
rerender()
