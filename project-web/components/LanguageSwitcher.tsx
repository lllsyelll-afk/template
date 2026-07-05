import { useLanguage, type Language } from "@components/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguageTo } = useLanguage();
  const languages: { code: Language; name: string }[] = [
    { code: "ar", name: "العربية" },
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
  ];

  const currentLanguage = languages.find((lang) => lang.code === language);

  return (
    <Select
      value={language}
      onValueChange={(value) => setLanguageTo(value as Language)}
    >
      <SelectTrigger className="px-3 py-2 w-auto h-9 [&>*:last-child]:hidden md:[&>*:last-child]:block">
        <div className="flex items-center justify-center gap-2 w-full">
          <Globe className="w-4 h-4 shrink-0" />
          <SelectValue placeholder="Select language" className="text-center">
            <span className="font-medium text-sm">{currentLanguage?.name}</span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent position="item-aligned">
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
