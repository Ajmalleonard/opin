"use client";

import { Card, Button, Input } from "@heroui/react";
import { PanelCard } from "./PanelHelpers";

export function SkillsPanel({ store }: { store: any }) {
  const skills = store.skillsReport?.skills ?? [];
  const filtered = skills.filter((skill: any) => {
    if (!store.skillsFilter.trim()) {
      return true;
    }
    const q = store.skillsFilter.toLowerCase();
    return [skill.name, skill.description, skill.skillKey, skill.source].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(q),
    );
  });
  return (
    <div className="space-y-5">
      <PanelCard title="Skills" description="Manage installed skills, API keys, and enablement.">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            aria-label="Filter skills"
            value={store.skillsFilter}
            onChange={(e) => {
              store.skillsFilter = e.target.value;
              store.touch();
            }}
            placeholder="Search skills..."
            className="bg-background rounded-full w-full max-w-md shadow-none"
          />
          <Button className="" variant="outline" onPress={() => store.refreshSkills()}>
            Reload
          </Button>
        </div>
      </PanelCard>

      <div className="grid gap-3">
        {filtered.map((skill: any) => (
          <Card
            key={skill.skillKey}
            className="border border-border bg-surface p-5 shadow-none rounded-2xl space-y-3"
          >
            <div className="flex flex-col gap-0.5">
              <h4 className="text-sm font-semibold text-foreground">{skill.name}</h4>
              <p className="text-xs text-muted">{skill.skillKey}</p>
            </div>
            <div className="space-y-2 text-sm text-foreground/70">
              <div>{skill.description}</div>
              <div>Source: {skill.source}</div>
              <div>Status: {skill.disabled ? "disabled" : "enabled"}</div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-1.5 px-3"
                onPress={() => store.updateSkillEnabled(skill.skillKey, !skill.disabled)}
              >
                {skill.disabled ? "Enable" : "Disable"}
              </Button>
              <Button
                className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-1.5 px-3"
                onPress={() => store.saveSkillApiKey(skill.skillKey)}
              >
                Save key
              </Button>
              {skill.install?.map((option: any) => (
                <Button
                  key={option.id}
                  className="border border-border bg-default/50 text-foreground font-semibold rounded-full hover:bg-default text-xs py-1.5 px-3"
                  onPress={() => store.installSkill(skill.skillKey, skill.name, option.id)}
                >
                  Install {option.label}
                </Button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
