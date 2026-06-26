export function Header() {
  const go = (id: string) => () => document.getElementById(id)?.scrollIntoView();
  return (
    <header className="site-head">
      <div className="wrap site-head__inner">
        <a className="brand" href="#top">Inference<i>Economics</i><span className="dot">.</span></a>
        <nav className="nav">
          <a href="#compute">COMPUTE</a>
          <a href="#gpu">GPU</a>
          <a href="#storage">STORAGE</a>
          <a href="#network">NETWORK</a>
          <a href="#total">TOTAL</a>
        </nav>
        <button className="btn" type="button" onClick={go('compute')}>Open the model →</button>
      </div>
    </header>
  );
}
