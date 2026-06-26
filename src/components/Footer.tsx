export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot__top">
          <div>
            <div className="foot__brand">Inference<i>Economics</i></div>
            <p className="foot__tag">The price of intelligence, tracked.</p>
          </div>
          <div className="foot__cols">
            <div>
              <p className="foot__h">Layers</p>
              <a href="#compute">Compute &amp; model</a>
              <a href="#gpu">GPU</a>
              <a href="#storage">Storage</a>
              <a href="#network">Network</a>
            </div>
            <div>
              <p className="foot__h">Tools</p>
              <a href="#compute">Model right-sizing</a>
              <a href="#gpu">GPU → token cost</a>
              <a href="#network">Egress estimator</a>
            </div>
          </div>
        </div>
        <hr className="foot__rule" />
        <div className="foot__fine">
          <span>© 2026 InferenceEconomics</span>
          <span>Figures shown are illustrative placeholders — swap in your live dataset before publishing.</span>
        </div>
      </div>
    </footer>
  );
}
