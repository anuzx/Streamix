import videojs from "video.js";
import "videojs-contrib-quality-levels";

const MenuButton = videojs.getComponent("MenuButton");
const MenuItem = videojs.getComponent("MenuItem");

// ─── QualityItem ──────────────────────────────────────────────────────────────

class QualityItem extends MenuItem {
  private _height: number | "auto";

  constructor(player: any, options: any) {
    super(player, { ...options, selectable: true, selected: options.selected ?? false });
    this._height = options.height;

    // Use this.on() — Video.js types don't expose handleClick directly
    this.on("click", () => {
      const levels = (this.player() as any).qualityLevels();
      for (let i = 0; i < levels.length; i++) {
        levels[i].enabled =
          this._height === "auto" || levels[i].height === this._height;
      }

      // Move the checkmark to this item
      const parent = this.parentComponent_ as any;
      if (parent?.children) {
        parent.children().forEach((child: any) => {
          if (child instanceof QualityItem) {
            child.selected(child === this);
          }
        });
      }
    });
  }
}

videojs.registerComponent("QualityItem", QualityItem);

// ─── QualityMenuButton ────────────────────────────────────────────────────────

class QualityMenuButton extends MenuButton {
  constructor(player: any, options: any) {
    super(player, options);
    this.controlText("Quality");

    // Rebuild the menu whenever a new rendition is parsed from the manifest
    const levels = (player as any).qualityLevels();
    levels.on("addqualitylevel", () => {
      this.update(); // re-calls createItems() and re-renders
    });
  }

  createItems(): any[] {
    const player = this.player() as any;
    const levels = player.qualityLevels?.();
    const items: any[] = [];

    if (!levels || levels.length === 0) return items;

    // Auto (enable all levels — let ABR decide)
    items.push(
      new QualityItem(player, { label: "Auto", height: "auto", selected: true })
    );

    // One item per unique height, sorted highest first
    const seen = new Set<number>();
    for (let i = 0; i < levels.length; i++) {
      if (levels[i].height) seen.add(levels[i].height);
    }

    Array.from(seen)
      .sort((a, b) => b - a)
      .forEach((height) => {
        items.push(
          new QualityItem(player, { label: `${height}p`, height, selected: false })
        );
      });

    return items;
  }

  buildCSSClass() {
    return `vjs-quality-menu ${super.buildCSSClass()}`;
  }
}

videojs.registerComponent("QualityMenuButton", QualityMenuButton);

export default QualityMenuButton;
