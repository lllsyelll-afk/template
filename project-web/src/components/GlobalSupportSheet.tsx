import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Checkbox } from "@components/ui/checkbox";
import { Button } from "@components/ui/button";
import BottomSheet from "@components/BottomSheet";
import { PhotoUploader } from "@components/PhotoUploader";
import { useSupport } from "@/contexts/SupportContext";
import { useTranslation } from "../../node_modules/react-i18next";

export function GlobalSupportSheet() {
  const { t } = useTranslation();
  const {
    showSupportSheet,
    setShowSupportSheet,
    supportMessage,
    setSupportMessage,
    supportPhoto,
    setSupportPhoto,
    supportCategory,
    setSupportCategory,
    sendingSupport,
    sendSupportRequest,
    isAutoCapturedScreenshot,
  } = useSupport();

  return (
    <BottomSheet
      open={showSupportSheet}
      onOpenChange={setShowSupportSheet}
      title={t("profile_contact_support")}
    >
      <div className="flex flex-col gap-4 p-4">
        <p className="text-sm">{t("profile_support_description")}</p>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Label className="font-semibold">
              {t("profile_screenshot_optional")}
            </Label>
            {isAutoCapturedScreenshot && (
              <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full text-green-800 text-xs">
                <span className="bg-green-500 rounded-full w-2 h-2"></span>
                Auto-captured
              </div>
            )}
          </div>
          {isAutoCapturedScreenshot && (
            <p className="text-muted-foreground text-xs">
              Screenshot was automatically captured when you took a screenshot.
              You can remove or modify it if needed.
            </p>
          )}
          <PhotoUploader
            value={supportPhoto}
            onChange={setSupportPhoto}
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            name="support-screenshot"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="supportMessage" className="font-semibold">
            {t("profile_message")}
          </Label>
          <Textarea
            id="supportMessage"
            placeholder={t("profile_describe_issue")}
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            className="min-h-25"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="font-semibold">{t("profile_category")}</Label>
          <div className="flex flex-col gap-2">
            {[
              { value: "user", label: t("profile_category_user") },
              {
                value: "technical",
                label: t("profile_category_technical"),
              },
              { value: "other", label: t("profile_category_other") },
            ].map((category) => (
              <div key={category.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.value}`}
                  checked={supportCategory === category.value}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSupportCategory(category.value);
                    } else {
                      setSupportCategory("");
                    }
                  }}
                />
                <Label
                  htmlFor={`category-${category.value}`}
                  className="font-medium text-sm cursor-pointer"
                >
                  {category.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={sendSupportRequest}
          disabled={
            !supportMessage.trim() || !supportCategory || sendingSupport
          }
          className="w-full"
        >
          {sendingSupport
            ? t("profile_sending")
            : t("profile_send_support_request")}
        </Button>
      </div>
    </BottomSheet>
  );
}
