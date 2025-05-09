import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Play, Info, Clipboard, Check } from "lucide-react";

interface CodeEditorProps {
  title: string;
  code: string;
  language?: "hcl" | "yaml" | "json";
  readOnly?: boolean;
  onChange?: (code: string) => void;
  onApply?: () => void;
  actions?: React.ReactNode;
}

export function CodeEditor({
  title,
  code,
  language = "hcl",
  readOnly = false,
  onChange,
  onApply,
  actions,
}: CodeEditorProps) {
  const [value, setValue] = useState(code);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(code);
  }, [code]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
            {language && (
              <span className="text-xs ml-2 bg-neutral-2 text-neutral-4 px-2 py-0.5 rounded-full">{language}</span>
            )}
          </div>
          <div className="flex">
            {!readOnly && (
              <Button 
                onClick={onApply} 
                className="mr-2 bg-primary text-white"
                size="sm"
              >
                <Play className="h-4 w-4 mr-1" /> Apply
              </Button>
            )}
            {!readOnly && (
              <Button 
                variant="outline" 
                className="mr-2 border-primary text-primary"
                size="sm"
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-8 w-8"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
            </Button>
            {actions}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative font-mono text-sm">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            className="w-full h-full p-4 font-mono text-sm bg-[#161616] text-white outline-none resize-none min-h-[300px] rounded-b-md"
            readOnly={readOnly}
            spellCheck={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface CodeEditorWithVariablesProps extends CodeEditorProps {
  variables?: Record<string, any>;
  onVariableChange?: (name: string, value: string) => void;
  actionButton?: boolean;
}

export function CodeEditorWithVariables({
  title,
  code,
  variables,
  language = "hcl",
  readOnly = false,
  onChange,
  onApply,
  onVariableChange,
  actions,
  actionButton = true,
}: CodeEditorWithVariablesProps) {
  return (
    <Tabs defaultValue="code">
      <Card className="shadow-sm border">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CardTitle className="text-lg font-medium">{title}</CardTitle>
            </div>
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
              </TabsList>
              <div className="ml-4">
                {!readOnly && actionButton && (
                  <Button 
                    onClick={onApply} 
                    className="mr-2 bg-primary text-white"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-1" /> Apply
                  </Button>
                )}
                {!readOnly && (
                  <Button 
                    variant="outline" 
                    className="mr-2 border-primary text-primary"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                )}
                {actions}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TabsContent value="code" className="mt-0">
            <div className="relative font-mono text-sm">
              <textarea
                value={code}
                onChange={(e) => onChange?.(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm bg-[#161616] text-white outline-none resize-none min-h-[300px] rounded-b-md"
                readOnly={readOnly}
                spellCheck={false}
              />
            </div>
          </TabsContent>
          <TabsContent value="variables" className="mt-0 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variables && Object.entries(variables).map(([key, value]) => (
                <div key={key} className="mb-3">
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  {typeof value === 'boolean' ? (
                    <select
                      className="w-full px-3 py-2 border border-neutral-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      value={value.toString()}
                      onChange={(e) => onVariableChange?.(key, e.target.value)}
                      disabled={readOnly}
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : Array.isArray(value) ? (
                    <textarea
                      className="w-full px-3 py-2 border border-neutral-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      value={value.join('\n')}
                      onChange={(e) => onVariableChange?.(key, e.target.value)}
                      disabled={readOnly}
                      rows={Math.min(4, value.length + 1)}
                    />
                  ) : typeof value === 'object' ? (
                    <textarea
                      className="w-full px-3 py-2 border border-neutral-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      value={JSON.stringify(value, null, 2)}
                      onChange={(e) => onVariableChange?.(key, e.target.value)}
                      disabled={readOnly}
                      rows={4}
                    />
                  ) : (
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-neutral-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      value={value}
                      onChange={(e) => onVariableChange?.(key, e.target.value)}
                      disabled={readOnly}
                    />
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}

export default CodeEditor;
