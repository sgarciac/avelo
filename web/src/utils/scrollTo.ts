export function scrollToDivById(id: string, offset: number = 0) {
  const element = document.getElementById(id)
  if (!element) return

  const top = element.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({
    top,
    behavior: 'smooth'
  })
}
