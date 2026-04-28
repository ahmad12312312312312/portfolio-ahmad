import "./Login.css";

import { useNavigate } from "react-router-dom";
import SoftAurora from "./SoftAurora";

export default function Login() {
  const navigate = useNavigate();
  const handleProceed = () => {
    navigate("/mains");
  };

  return (
    <>
      <div className="page-aurora" aria-hidden="true">
        <SoftAurora
          speed={0.22}
          scale={2.2}
          brightness={0.45}
          color1="#ffffff"
          color2="#bdbdbd"
          noiseFrequency={1.6}
          noiseAmplitude={0.55}
          bandHeight={0.42}
          bandSpread={1}
          octaveDecay={0.12}
          layerOffset={0.12}
          colorSpeed={0.35}
          enableMouseInteraction
          useWindowMouse
          mouseInfluence={0.1}
        />
        <div className="page-aurora-grain" />
        <div className="page-aurora-vignette" />
      </div>

      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome</h2>
            <p>Proceed to the main page.</p>
          </div>

          <form className="auth-form" noValidate>
            <button
              type="button"
              className="btn-primary btn-full"
              onClick={handleProceed}
            >
              Proceed to main page
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
