export default function decorate(block) {
  const btn = block.querySelector('a.button');
  if (btn) {
    btn.classList.remove('primary', 'secondary');
    btn.classList.add('tertiary');
  }
}
