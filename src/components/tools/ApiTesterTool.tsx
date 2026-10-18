import React, { useState } from 'react';
import {
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  Clock,
  Database,
  ArrowRight,
  Code2,
  RefreshCw,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface HeaderItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface ParamItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export const ApiTesterTool: React.FC = () => {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'>('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [activeReqTab, setActiveReqTab] = useState<'params' | 'headers' | 'body'>('params');
  const [params, setParams] = useState<ParamItem[]>([
    { id: '1', key: '', value: '', enabled: true }
  ]);
  const [headers, setHeaders] = useState<HeaderItem[]>([
    { id: '1', key: 'Accept', value: 'application/json', enabled: true }
  ]);
  const [reqBody, setReqBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');

  // Response state
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{
    status?: number;
    statusText?: string;
    latencyMs?: number;
    headers?: Record<string, string>;
    data?: any;
    error?: string;
  } | null>(null);
  const [activeResTab, setActiveResTab] = useState<'body' | 'headers'>('body');
  const [copied, setCopied] = useState(false);

  // Quick Samples
  const samples = [
    { label: 'JSONPlaceholder Post', method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts/1' },
    { label: 'GitHub API User', method: 'GET', url: 'https://api.github.com/users/octocat' },
    { label: 'Create Post (JSON)', method: 'POST', url: 'https://jsonplaceholder.typicode.com/posts' }
  ];

  const handleSend = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setResponse(null);

    try {
      // Build final URL with enabled query params
      const parsedUrl = new URL(url);
      params.forEach((p) => {
        if (p.enabled && p.key.trim()) {
          parsedUrl.searchParams.set(p.key.trim(), p.value);
        }
      });

      const forwardHeaders: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.enabled && h.key.trim()) {
          forwardHeaders[h.key.trim()] = h.value;
        }
      });

      let parsedBody: any = undefined;
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && reqBody.trim()) {
        try {
          parsedBody = JSON.parse(reqBody);
        } catch {
          parsedBody = reqBody;
        }
      }

      const res = await fetch('/api/tools/proxy-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: parsedUrl.toString(),
          method,
          headers: forwardHeaders,
          body: parsedBody
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setResponse({
          status: data.status || 500,
          statusText: data.statusText || 'Error',
          latencyMs: data.latencyMs,
          error: data.error || 'Request failed',
          data: data.data
        });
      } else {
        setResponse({
          status: data.status,
          statusText: data.statusText,
          latencyMs: data.latencyMs,
          headers: data.headers,
          data: data.data
        });
      }
    } catch (err: any) {
      setResponse({
        error: err.message || 'Connection error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!response?.data) return;
    const str = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data);
    navigator.clipboard.writeText(str);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    PATCH: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    DELETE: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    HEAD: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
  };

  return (
    <div className="h-full flex flex-col p-3 sm:p-5 overflow-y-auto space-y-4">
      {/* Top Banner / Sample Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">REST API Tester</span>
          <span className="text-xs text-zinc-400">· Fast HTTP client with real server-side proxy</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {samples.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setMethod(s.method as any);
                setUrl(s.url);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Request Input Row */}
      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 shadow-sm">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as any)}
          aria-label="HTTP Method"
          className={`font-mono text-xs font-bold px-3 py-2 rounded-lg border outline-hidden cursor-pointer ${methodColors[method] || ''}`}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
          <option value="HEAD">HEAD</option>
        </select>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/v1/endpoint"
          aria-label="Request URL"
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 outline-hidden font-mono"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          {isLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>Send</span>
        </button>
      </div>

      {/* Split Panes: Request Config & Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[380px]">
        {/* Request Pane */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
          {/* Request Subtabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800 bg-zinc-950/40 text-xs">
            <button
              type="button"
              onClick={() => setActiveReqTab('params')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeReqTab === 'params' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Params ({params.filter((p) => p.key).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveReqTab('headers')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeReqTab === 'headers' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Headers ({headers.filter((h) => h.key).length})
            </button>
            {['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && (
              <button
                type="button"
                onClick={() => setActiveReqTab('body')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeReqTab === 'body' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                JSON Body
              </button>
            )}
          </div>

          {/* Request Tab Body */}
          <div className="flex-1 p-3 overflow-y-auto">
            {activeReqTab === 'params' && (
              <div className="space-y-2">
                {params.map((param, index) => (
                  <div key={param.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => {
                        const updated = [...params];
                        updated[index].enabled = e.target.checked;
                        setParams(updated);
                      }}
                      className="rounded border-zinc-700 text-zinc-200 focus:ring-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => {
                        const updated = [...params];
                        updated[index].key = e.target.value;
                        setParams(updated);
                      }}
                      placeholder="Parameter Key"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono outline-hidden"
                    />
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => {
                        const updated = [...params];
                        updated[index].value = e.target.value;
                        setParams(updated);
                      }}
                      placeholder="Value"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setParams(params.filter((_, i) => i !== index))}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setParams([...params, { id: String(Date.now()), key: '', value: '', enabled: true }])}
                  className="text-xs text-zinc-300 hover:text-white font-semibold flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Param
                </button>
              </div>
            )}

            {activeReqTab === 'headers' && (
              <div className="space-y-2">
                {headers.map((header, index) => (
                  <div key={header.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => {
                        const updated = [...headers];
                        updated[index].enabled = e.target.checked;
                        setHeaders(updated);
                      }}
                      className="rounded border-zinc-700 text-zinc-200 focus:ring-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => {
                        const updated = [...headers];
                        updated[index].key = e.target.value;
                        setHeaders(updated);
                      }}
                      placeholder="Header Name"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono outline-hidden"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => {
                        const updated = [...headers];
                        updated[index].value = e.target.value;
                        setHeaders(updated);
                      }}
                      placeholder="Value"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setHeaders(headers.filter((_, i) => i !== index))}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setHeaders([...headers, { id: String(Date.now()), key: '', value: '', enabled: true }])}
                  className="text-xs text-zinc-300 hover:text-white font-semibold flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Header
                </button>
              </div>
            )}

            {activeReqTab === 'body' && (
              <div className="h-full flex flex-col">
                <textarea
                  value={reqBody}
                  onChange={(e) => setReqBody(e.target.value)}
                  placeholder={'{\n  "key": "value"\n}'}
                  rows={10}
                  className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 outline-hidden resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Response Pane */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-950/40 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-300">Response</span>
              {response?.status && (
                <span
                  className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
                    response.status >= 200 && response.status < 300
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : response.status >= 400
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {response.status} {response.statusText}
                </span>
              )}
              {response?.latencyMs !== undefined && (
                <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {response.latencyMs}ms
                </span>
              )}
            </div>

            {response?.data && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveResTab('body')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    activeResTab === 'body' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Body
                </button>
                {response.headers && (
                  <button
                    type="button"
                    onClick={() => setActiveResTab('headers')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      activeResTab === 'headers' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Headers
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyResponse}
                  className="p-1 text-zinc-400 hover:text-white rounded-md transition-colors"
                  title="Copy response body"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 p-3 overflow-auto bg-zinc-950 font-mono text-xs">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                <span>Executing HTTP request...</span>
              </div>
            ) : response ? (
              response.error ? (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  <p className="font-bold mb-1">Request Failed</p>
                  <p className="text-[11px] opacity-90">{response.error}</p>
                </div>
              ) : activeResTab === 'body' ? (
                <pre className="text-zinc-300 whitespace-pre-wrap select-text leading-relaxed">
                  {typeof response.data === 'object'
                    ? JSON.stringify(response.data, null, 2)
                    : String(response.data)}
                </pre>
              ) : (
                <div className="space-y-1">
                  {response.headers &&
                    Object.entries(response.headers).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-zinc-400">
                        <span className="text-blue-400 font-semibold">{k}:</span>
                        <span className="text-zinc-300 break-all">{v}</span>
                      </div>
                    ))}
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-1.5">
                <Code2 className="w-6 h-6 opacity-40" />
                <p>Click "Send" to execute request and inspect response</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
