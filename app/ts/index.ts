import { createElement, render } from 'preact'
import { App } from './App'

render(createElement(App, { greeting: 'Hello' }), document.body)
