export class AudioManager
{
    constructor()
    {
        this.assets = new Map();

        this.channels = {
            master: { volume: 1, muted: false, paused: false },
            music: { volume: 1, muted: false, paused: false },
            sfx: { volume: 1, muted: false, paused: false },
        };

        this.currentMusic = null;
        this.currentMusicKey = null;
        this.activeSfx = new Set();
    }

    setAudioAssets(assets)
    {
        this.assets = assets instanceof Map ? assets : new Map();
        return this;
    }

    getAudioAsset(key)
    {
        return this.assets.get(key) || null;
    }

    hasAudio(key)
    {
        return this.assets.has(key);
    }

    setVolume(channel, value)
    {
        this.validateChannel(channel);
        this.channels[channel].volume = this.clamp01(value);
        this.updateVolumes();
        return this;
    }

    getVolume(channel)
    {
        this.validateChannel(channel);
        return this.channels[channel].volume;
    }

    mute(channel = "master")
    {
        this.validateChannel(channel);
        this.channels[channel].muted = true;
        this.updateVolumes();
        return this;
    }

    unmute(channel = "master")
    {
        this.validateChannel(channel);
        this.channels[channel].muted = false;
        this.updateVolumes();
        return this;
    }

    toggleMute(channel = "master")
    {
        this.validateChannel(channel);
        this.channels[channel].muted = !this.channels[channel].muted;
        this.updateVolumes();
        return this.channels[channel].muted;
    }

    isMuted(channel = "master")
    {
        this.validateChannel(channel);
        return this.channels[channel].muted;
    }

    pause(channel = "master")
    {
        this.validateChannel(channel);

        this.channels[channel].paused = true;

        if (channel === "master")
        {
            this.pauseClip(this.currentMusic);
            this.activeSfx.forEach(clip => this.pauseClip(clip));
            return this;
        }

        if (channel === "music")
        {
            this.pauseClip(this.currentMusic);
            return this;
        }

        this.activeSfx.forEach(clip => this.pauseClip(clip));
        return this;
    }

    resume(channel = "master")
    {
        this.validateChannel(channel);

        this.channels[channel].paused = false;

        if (channel === "master")
        {
            if (!this.channels.music.paused)
            {
                this.resumeClip(this.currentMusic, "music");
            }

            if (!this.channels.sfx.paused)
            {
                this.activeSfx.forEach(clip => this.resumeClip(clip, "sfx"));
            }

            return this;
        }

        if (this.isEffectivelyPaused(channel))
        {
            return this;
        }

        if (channel === "music")
        {
            this.resumeClip(this.currentMusic, "music");
            return this;
        }

        this.activeSfx.forEach(clip => this.resumeClip(clip, "sfx"));
        return this;
    }

    isPaused(channel = "master")
    {
        this.validateChannel(channel);
        return this.channels[channel].paused;
    }

    playMusic(key, params = {})
    {
        const options = {
            loop: params.loop ?? true,
            restart: params.restart ?? true,
            volume: params.volume ?? 1,
            playbackRate: params.playbackRate ?? 1,
        };

        if (
            !options.restart &&
            this.currentMusic &&
            this.currentMusicKey === key
        )
        {
            this.updateVolumes();
            this.resumeClip(this.currentMusic, "music");
            return this.currentMusic;
        }

        this.stopMusic();

        const clip = this.createClip(key, {
            loop: options.loop,
            playbackRate: options.playbackRate,
            baseVolume: options.volume,
        });

        clip.addEventListener("ended", () =>
        {
            if (this.currentMusic === clip)
            {
                this.currentMusic = null;
                this.currentMusicKey = null;
            }
        });

        this.currentMusic = clip;
        this.currentMusicKey = key;

        this.applyVolume(clip, "music");
        this.resumeClip(clip, "music");

        return clip;
    }

    stopMusic(resetTime = true)
    {
        if (!this.currentMusic) return this;

        this.currentMusic.pause();

        if (resetTime)
        {
            this.currentMusic.currentTime = 0;
        }

        this.currentMusic = null;
        this.currentMusicKey = null;
        return this;
    }

    playSfx(key, params = {})
    {
        const options = {
            loop: params.loop ?? false,
            volume: params.volume ?? 1,
            playbackRate: params.playbackRate ?? 1,
        };

        const clip = this.createClip(key, {
            loop: options.loop,
            playbackRate: options.playbackRate,
            baseVolume: options.volume,
        });

        const cleanup = () =>
        {
            this.activeSfx.delete(clip);
            clip.removeEventListener("ended", cleanup);
            clip.removeEventListener("error", cleanup);
        };

        clip.addEventListener("ended", cleanup);
        clip.addEventListener("error", cleanup);

        this.activeSfx.add(clip);

        this.applyVolume(clip, "sfx");
        this.resumeClip(clip, "sfx");

        return clip;
    }

    stopSfx(resetTime = true)
    {
        const clips = Array.from(this.activeSfx);
        clips.forEach(clip =>
        {
            clip.pause();

            if (resetTime)
            {
                clip.currentTime = 0;
            }

            this.activeSfx.delete(clip);
        });

        return this;
    }

    stopAll(resetTime = true)
    {
        this.stopMusic(resetTime);
        this.stopSfx(resetTime);
        return this;
    }

    updateVolumes()
    {
        this.applyVolume(this.currentMusic, "music");
        this.activeSfx.forEach(clip => this.applyVolume(clip, "sfx"));
        return this;
    }

    createClip(key, params = {})
    {
        const source = this.getAudioAsset(key);

        if (!source)
        {
            throw new Error(`Audio asset "${key}" not found`);
        }

        const clip = source.cloneNode(true);
        clip.preload = "auto";
        clip.loop = Boolean(params.loop);
        clip.playbackRate = params.playbackRate ?? 1;
        clip.currentTime = 0;
        clip.__baseVolume = this.clamp01(params.baseVolume ?? 1);
        clip.__pausedByManager = false;

        return clip;
    }

    pauseClip(clip)
    {
        if (!clip || clip.paused) return;
        clip.__pausedByManager = true;
        clip.pause();
    }

    resumeClip(clip, channel)
    {
        if (!clip) return;

        if (this.isEffectivelyPaused(channel))
        {
            clip.__pausedByManager = true;
            clip.pause();
            return;
        }

        if (!clip.paused && !clip.__pausedByManager)
        {
            return;
        }

        clip.__pausedByManager = false;
        const playPromise = clip.play();

        if (playPromise && typeof playPromise.catch === "function")
        {
            playPromise.catch(() => {});
        }
    }

    applyVolume(clip, channel)
    {
        if (!clip) return;

        const masterVolume = this.channels.master.volume;
        const channelVolume = this.channels[channel].volume;
        const baseVolume = this.clamp01(clip.__baseVolume ?? 1);

        clip.volume = this.clamp01(masterVolume * channelVolume * baseVolume);
        clip.muted = this.isEffectivelyMuted(channel);
    }

    isEffectivelyMuted(channel)
    {
        return this.channels.master.muted || this.channels[channel].muted;
    }

    isEffectivelyPaused(channel)
    {
        return this.channels.master.paused || this.channels[channel].paused;
    }

    validateChannel(channel)
    {
        if (!this.channels[channel])
        {
            throw new Error(`Unknown audio channel: ${channel}`);
        }
    }

    clamp01(value)
    {
        const numericValue = Number.isFinite(value) ? value : 1;
        return Math.max(0, Math.min(1, numericValue));
    }
}
