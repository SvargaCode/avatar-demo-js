class Avatar {
    constructor(canvas) {
        this.apiUrl = "https://heroapi.juhuixinkj.com/api/Metaverse/getSpineConfig";

        this.nftName = "BAYC";
        this.nftId = 1;
        this.animName = "run";

        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");

        this.skeletonRenderer = new spine.canvas.SkeletonRenderer(this.context);
        this.skeletonRenderer.triangleRendering = true;

        this.scale = 0.5;
        this.xOffset = 0;
        this.yOffset = 0;

        this.lastFrameTime = Date.now() / 1000;

        this.load();
    }

    async load() {
        let response = await util.requestHttp({
            url: this.apiUrl,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                name: this.nftName,
                id: this.nftId,
            },
        });

        let info = JSON.parse(response).info;
        let urlPre = info.json.substring(0, info.json.lastIndexOf("/") + 1);

        let assetManager = new spine.canvas.AssetManager();
        assetManager.loadText(info.json);
        assetManager.loadText(info.atlas);
        assetManager.loadTexture(info.texture);

        do {
            await util.sleep(10);
        } while (!assetManager.isLoadingComplete());

        assetManager.assets[urlPre + this.nftName + ".png"]
             = assetManager.assets[info.texture];

        let atlas = new spine.TextureAtlas(assetManager.get(info.atlas), (path) => {
            return assetManager.get(urlPre + path);
        });

        let atlasLoader = new spine.AtlasAttachmentLoader(atlas);
        let skeletonJson = new spine.SkeletonJson(atlasLoader);

        let skeletonData = skeletonJson.readSkeletonData(
                assetManager.get(info.json));
        this.skeleton = new spine.Skeleton(skeletonData);
        this.skeleton.scaleY = -1;
        this.skeleton.setToSetupPose();
        this.skeleton.updateWorldTransform();

        this.state = new spine.AnimationState(
                new spine.AnimationStateData(this.skeleton.data));

        let offset = new spine.Vector2();
        let size = new spine.Vector2();
        this.skeleton.getBounds(offset, size, []);
        this.bounds = {
            offset: offset,
            size: size,
        };

        this.playAnim(this.animName);
    }

    resize() {
        let w = this.canvas.clientWidth;
        let h = Math.min(this.canvas.clientHeight, document.body.clientHeight * 0.9);
        if (this.canvas.width != w || this.canvas.height != h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }

        let centerX = this.bounds.offset.x + this.bounds.size.x / 2;
        let centerY = this.bounds.offset.y + this.bounds.size.y / 2;
        let scaleX = this.canvas.width / this.bounds.size.x;
        let scaleY = this.canvas.height / this.bounds.size.y;
        let scale = Math.min(Math.min(scaleX, scaleY), 4);
        let width = this.canvas.width / scale;
        let height = this.canvas.height / scale;

        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.scale(scale, scale);
        this.context.translate(width / 2 - centerX, height / 2 - centerY);
    }

    draw(x = 0, y = 0) {
        if (!this.skeleton) {
            return;
        }

        let now = Date.now() / 1000;
        let delta = now - this.lastFrameTime;
        this.lastFrameTime = now;

        this.resize();

        this.context.save();
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.fillStyle = "#cccccc";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.restore();

        this.context.scale(this.scale, this.scale);

        let tx = this.bounds.offset.x + this.bounds.size.x * 0.5;
        let ty = this.bounds.offset.y + this.bounds.size.y * 1;
        x = x / this.scale - tx + this.xOffset;
        y = y / this.scale - ty + this.yOffset;
        this.context.translate(x, y);

        this.state.update(delta);
        this.state.apply(this.skeleton);

        this.skeleton.updateWorldTransform();
        this.skeletonRenderer.draw(this.skeleton);

        this.context.translate(-x, -y);
        this.context.scale(1 / this.scale, 1 / this.scale);
    }

    playAnim(animName) {
        if (!this.skeleton) {
            return;
        }

        this.state.addAnimation(0, animName, true);
    }
}

window.Avatar = Avatar;
