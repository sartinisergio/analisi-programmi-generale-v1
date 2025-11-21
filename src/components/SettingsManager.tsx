import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Key, Save, Eye, EyeOff } from 'lucide-react';

export function SettingsManager() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadApiKey();
  }, [user]);

  async function loadApiKey() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('openai_api_key')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.openai_api_key) {
        setApiKey(data.openai_api_key);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  }

  async function handleSaveApiKey() {
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ openai_api_key: apiKey || null })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Chiave API salvata con successo!' });
    } catch (error) {
      console.error('Error saving API key:', error);
      setMessage({ type: 'error', text: 'Errore nel salvare la chiave API' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Key className="text-blue-600" size={24} />
        <h2 className="text-xl font-bold text-gray-800">Impostazioni API</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            La tua chiave API verrà utilizzata per le analisi con OpenAI. Puoi ottenerla da{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              platform.openai.com/api-keys
            </a>
          </p>
        </div>

        <button
          onClick={handleSaveApiKey}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {loading ? 'Salvataggio...' : 'Salva Chiave API'}
        </button>

        {message && (
          <div
            className={`p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
