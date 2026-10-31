# Shrinkray

Shrinkray resizes and compresses a folder of images from the command line. On a 2021 MacBook Air it turns 1,000 phone photos (4.1 GB) into 1200px-wide JPEGs (310 MB) in about 40 seconds.

It reads JPEG, PNG and WebP, and writes the same formats. AVIF support is planned for 0.4.

## Install

```bash
npm install -g shrinkray
```

Requires Node 20 or later. No native dependencies to compile.

## Usage

Resize everything in `./photos` to 1200px wide and write the results to `./photos/out`:

```bash
shrinkray ./photos --width 1200
```

Shrinkray runs one worker per CPU core. Files that fail to decode are skipped and listed at the end, so one corrupt image won't stop a batch of thousands.

Common options:

| Flag | Default | What it does |
| --- | --- | --- |
| `--width` | none | Target width in pixels; height keeps the aspect ratio |
| `--quality` | 82 | JPEG and WebP quality, 1 to 100 |
| `--out` | `<input>/out` | Output directory |
| `--dry-run` | off | Print what would change without writing files |

## Why another image tool?

Most image optimizers are either GUI apps or build plugins tied to one bundler. Shrinkray is a single command you can run on a folder, in a script, or in CI, with output that is the same every time.

## Contributing

Bug reports with a sample image are the most useful kind. See `CONTRIBUTING.md` for how to run the tests locally. Questions go in GitHub Discussions.

## License

MIT
