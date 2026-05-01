# Audio

Audio is managed by `engine.audio`, an `AudioManager`.

## Loading

```js
await engine.prepareData({
    audio: [
        { key: "music", src: "assets/music.mp3" },
        { key: "jump", src: "assets/jump.wav" },
    ],
});
```

## Music

```js
engine.audio.playMusic("music", {
    loop: true,
    volume: 0.7,
});

engine.audio.stopMusic();
```

## SFX

```js
engine.audio.playSfx("jump", {
    volume: 1,
    playbackRate: 1,
});

engine.audio.stopSfx();
```

## Volume And Channels

Channels: `master`, `music`, `sfx`.

```js
engine.audio.setVolume("master", 0.8);
engine.audio.setVolume("music", 0.5);
engine.audio.getVolume("sfx");
```

## Mute / Pause

```js
engine.audio.mute("sfx");
engine.audio.unmute("sfx");
engine.audio.toggleMute("master");

engine.audio.pause("music");
engine.audio.resume("music");
```

## Browser Autoplay

Browsers often block audio until the user interacts with the page. Start music or first SFX after click/touch/key input when targeting browsers.
