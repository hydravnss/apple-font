/**
 * Police Apple — San Francisco (police système Apple) dans SillyTavern,
 * avec un choix simple entre texte normal et texte gras.
 *
 * Sur iPhone et Mac, -apple-system / BlinkMacSystemFont = SF Pro.
 * Les fichiers SF Pro ne sont pas embarqués (licence Apple).
 * On règle aussi --mainFontFamily (variable officielle ST depuis 1.12.2).
 */

const MODULE_NAME = 'apple_font';
const LOG = '[Police Apple]';

const APPLE_STACK = [
    '-apple-system',
    'BlinkMacSystemFont',
    '"SF Pro Text"',
    '"SF Pro Display"',
    '"SF Compact Text"',
    'system-ui',
    '"Helvetica Neue"',
    'Helvetica',
    'Arial',
    'sans-serif',
].join(', ');

const defaultSettings = Object.freeze({
    enabled: true,
    weight: 'normal', // normal | bold
    weightScope: 'chat', // chat | all
});

const ctx = () => SillyTavern.getContext();
const save = () => ctx().saveSettingsDebounced();

let settings = null;

function loadSettings() {
    const store = ctx().extensionSettings;
    store[MODULE_NAME] = Object.assign({}, defaultSettings, store[MODULE_NAME] || {});
    settings = store[MODULE_NAME];
}

function apply() {
    const root = document.documentElement;
    const body = document.body;
    const on = !!(settings && settings.enabled);
    const bold = on && settings.weight === 'bold';

    body.classList.toggle('af-on', on);
    body.classList.toggle('af-bold', bold);
    body.classList.toggle('af-weight-all', on && settings.weightScope === 'all');

    if (on) {
        root.style.setProperty('--mainFontFamily', APPLE_STACK);
        root.style.setProperty('--af-stack', APPLE_STACK);
        root.style.setProperty('--af-weight', '600');
        root.style.setProperty('--af-weight-strong', '800');
    } else {
        root.style.removeProperty('--mainFontFamily');
        root.style.removeProperty('--af-stack');
        root.style.removeProperty('--af-weight');
        root.style.removeProperty('--af-weight-strong');
    }
}

const SETTINGS_HTML = `
<div id="af_settings" class="extension_container">
  <div class="inline-drawer">
    <div class="inline-drawer-toggle inline-drawer-header">
      <b>Police Apple</b>
      <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
    </div>
    <div class="inline-drawer-content">
      <div class="af-hint">Applique la police Apple (San Francisco) à SillyTavern. Sur iPhone, c’est la police du système. Tu peux garder le texte normal ou le passer en gras.</div>
      <div class="af-row">
        <label for="af_enabled">Activer</label>
        <input type="checkbox" id="af_enabled">
      </div>
      <div class="af-row">
        <label for="af_weight">Texte</label>
        <select id="af_weight" class="text_pole">
          <option value="normal">Normal</option>
          <option value="bold">Gras</option>
        </select>
      </div>
      <div class="af-row">
        <label for="af_scope">Appliquer le gras à</label>
        <select id="af_scope" class="text_pole">
          <option value="chat">Chat seulement</option>
          <option value="all">Toute l’interface</option>
        </select>
      </div>
    </div>
  </div>
</div>`;

function bindSettingsUi() {
    const q = (id) => document.getElementById(id);
    const refreshUi = () => {
        q('af_enabled').checked = settings.enabled;
        q('af_weight').value = settings.weight;
        q('af_scope').value = settings.weightScope;
        q('af_scope').disabled = !settings.enabled || settings.weight !== 'bold';
    };
    const bind = (id, key, { bool = false } = {}) => {
        q(id).addEventListener('input', () => {
            const el = q(id);
            settings[key] = bool ? el.checked : el.value;
            save();
            refreshUi();
            apply();
        });
    };
    bind('af_enabled', 'enabled', { bool: true });
    bind('af_weight', 'weight');
    bind('af_scope', 'weightScope');
    refreshUi();
}

jQuery(async () => {
    loadSettings();
    window.jQuery('#extensions_settings2').append(SETTINGS_HTML);
    bindSettingsUi();
    apply();

    try {
        const { eventSource, event_types } = ctx();
        eventSource.on(event_types.APP_READY, apply);
        eventSource.on(event_types.SETTINGS_LOADED_AFTER, () => {
            loadSettings();
            apply();
        });
    } catch (err) {
        console.debug(LOG, 'évènements indisponibles', err);
    }
    console.log(LOG, 'chargé');
});
