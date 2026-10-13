// Injected into the page by BannerPresenter. Chrome sends the source of this function to the
// page, so it has to be self-contained: no imports and no helpers from this file's scope.
export function renderBanner(verdict) {
  const id = 'steam_saver_banner';
  const colors = { safe: 'rgba(28, 190, 28, 0.5)', harmful: 'rgba(192, 8, 8, 0.5)' };
  const texts = { safe: 'This site is safe', harmful: 'Potentially harmful site' };

  document.getElementById(id)?.remove();

  const box = document.createElement('div');

  box.id = id;
  box.className = 'steam_saver';
  box.textContent = texts[verdict];
  Object.assign(box.style, {
    position: 'fixed',
    bottom: '100px',
    left: '0',
    width: '200px',
    height: '100px',
    color: '#fff',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors[verdict],
    borderTopRightRadius: '10px',
    borderBottomRightRadius: '10px',
    zIndex: '2147483647',
  });

  document.body.appendChild(box);
}
