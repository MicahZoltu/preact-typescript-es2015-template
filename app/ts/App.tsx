interface AppModel {
	greeting: string
}

export function App(model: AppModel) {
	return <div>{model.greeting} World!</div>
}
