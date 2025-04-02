export function setupCounter(element: HTMLButtonElement) {
  let counter = 0
  element.innerHTML = `count is ${counter}`
  element.addEventListener('click', () => {
    element.innerHTML = `count is ${++counter}`
  })
}
