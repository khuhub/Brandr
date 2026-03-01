"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FormState {
  brandName: string;
  brandDescription: string;
  disclosureTokens: string[];
  competitorKeywords: string[];
  prohibitedClaims: string[];
  creatorHandles: string[];
}

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const val = inputRef.current?.value.trim();
    if ((e.key === "Enter" || e.key === ",") && val) {
      e.preventDefault();
      onAdd(val);
      if (inputRef.current) inputRef.current.value = "";
    }
    if (e.key === "Backspace" && !inputRef.current?.value && tags.length > 0) {
      onRemove(tags.length - 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    const items = text.split(/[,\n\t\s]+/).map((s) => s.trim()).filter(Boolean);
    if (items.length > 0) {
      e.preventDefault();
      items.forEach((item) => onAdd(item));
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 min-h-[44px] cursor-text focus-within:ring-2 focus-within:ring-rose-200 focus-within:border-rose-300 transition-shadow"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-sm text-foreground/80"
        >
          {tag}
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="text-rose-400 hover:text-rose-600 text-xs leading-none"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

export default function EditCampaignPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    brandName: "",
    brandDescription: "",
    disclosureTokens: [],
    competitorKeywords: [],
    prohibitedClaims: [],
    creatorHandles: [],
  });

  useEffect(() => {
    const stored = localStorage.getItem("brandr_campaign");
    if (!stored) {
      router.replace("/campaigns/new");
      return;
    }
    try {
      const c = JSON.parse(stored);
      setExistingId(c._id || null);
      setForm({
        brandName: c.brandName || "",
        brandDescription: c.brandDescription || "",
        disclosureTokens: c.requiredDisclosureTokens || [],
        competitorKeywords: c.competitorKeywords || [],
        prohibitedClaims: c.prohibitedClaimKeywords || [],
        creatorHandles: c.creatorHandles || [],
      });
    } catch { /* ignore */ }
    setLoaded(true);
  }, [router]);

  function addTag(field: keyof FormState, tag: string) {
    setForm((prev) => {
      const arr = prev[field] as string[];
      if (arr.includes(tag)) return prev;
      return { ...prev, [field]: [...arr, tag] };
    });
  }

  function removeTag(field: keyof FormState, index: number) {
    setForm((prev) => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.filter((_, i) => i !== index) };
    });
  }

  function handleSave() {
    const campaign = {
      _id: existingId || crypto.randomUUID(),
      brandName: form.brandName.trim(),
      brandDescription: form.brandDescription.trim(),
      requiredDisclosureTokens: form.disclosureTokens,
      competitorKeywords: form.competitorKeywords,
      prohibitedClaimKeywords: form.prohibitedClaims,
      creatorHandles: form.creatorHandles,
      createdAt: Date.now(),
    };

    localStorage.setItem("brandr_campaign", JSON.stringify(campaign));
    localStorage.removeItem(`brandr_audit_status_${campaign._id}`);

    let history: Record<string, unknown>[] = [];
    try {
      history = JSON.parse(localStorage.getItem("brandr_campaigns") || "[]");
    } catch { /* ignore */ }
    const idx = history.findIndex((h) => h._id === campaign._id);
    if (idx >= 0) {
      history[idx] = campaign;
    } else {
      history.push(campaign);
    }
    localStorage.setItem("brandr_campaigns", JSON.stringify(history));

    router.push("/dashboard");
  }

  const canSave = form.brandName.trim().length > 0 && form.creatorHandles.length > 0;

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/40 to-white flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-rose-200 border-t-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 to-white">
      <div className="container mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-10 inline-block"
        >
          &larr; Back to dashboard
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Edit your campaign
        </h1>
        <p className="text-muted-foreground mb-10">
          All fields are shown at once — update what you need and save.
        </p>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
          {/* Brand Info */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Brand Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                placeholder="e.g. Acme Beauty"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-shadow placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Brand Description
              </label>
              <textarea
                value={form.brandDescription}
                onChange={(e) => setForm({ ...form, brandDescription: e.target.value })}
                placeholder="Describe your brand values, tone, and what your brand stands for..."
                rows={4}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-shadow resize-none placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Rules */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Required Disclosure Tokens
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Tags creators must include (e.g. #ad, #sponsored). Press Enter to add.
              </p>
              <TagInput
                tags={form.disclosureTokens}
                onAdd={(t) => addTag("disclosureTokens", t)}
                onRemove={(i) => removeTag("disclosureTokens", i)}
                placeholder="#ad, #sponsored, #paidpartnership"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Competitor Keywords
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Brand or product names creators should not mention.
              </p>
              <TagInput
                tags={form.competitorKeywords}
                onAdd={(t) => addTag("competitorKeywords", t)}
                onRemove={(i) => removeTag("competitorKeywords", i)}
                placeholder="CompetitorX, RivalBrand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Prohibited Claim Keywords
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Claims creators must not make (e.g. medical claims, guarantees).
              </p>
              <TagInput
                tags={form.prohibitedClaims}
                onAdd={(t) => addTag("prohibitedClaims", t)}
                onRemove={(i) => removeTag("prohibitedClaims", i)}
                placeholder="cure, guaranteed results, FDA approved"
              />
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Creators */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Creator Handles <span className="text-rose-400">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Add the TikTok handles you want to audit. Press Enter to add each one.
              </p>
              <TagInput
                tags={form.creatorHandles}
                onAdd={(t) => addTag("creatorHandles", t.replace(/^@/, ""))}
                onRemove={(i) => removeTag("creatorHandles", i)}
                placeholder="@stella.creates, @lifestyle.jake"
              />
              {form.creatorHandles.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {form.creatorHandles.length} creator{form.creatorHandles.length !== 1 && "s"} will be audited.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="rounded-lg bg-foreground text-background px-5 py-2 text-sm font-medium shadow-sm hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
