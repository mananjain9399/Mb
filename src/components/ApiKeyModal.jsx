export default function ApiKeyModal({ onSubmit }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const key = e.target.elements.apiKey.value.trim();
    if (key) onSubmit(key);
  };

  return (
    <div className="api-modal-overlay">
      <div className="api-modal">
        <div className="api-modal__icon">🔑</div>
        <h2 className="api-modal__title">Welcome to Nova</h2>
        <p className="api-modal__subtitle">
          Enter your Google Gemini API key to get started.
          <br />
          Your key stays local and is never sent to any server except Google.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="api-modal__input-wrap">
            <input
              id="api-key-input"
              name="apiKey"
              type="password"
              className="api-modal__input"
              placeholder="AIzaSy... (your Gemini API key)"
              autoFocus
              autoComplete="off"
            />
          </div>
          <button id="api-key-submit" type="submit" className="api-modal__btn">
            Connect &amp; Start
          </button>
        </form>
      </div>
    </div>
  );
}
