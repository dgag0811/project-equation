# Equation demo

The website supports live photo uploads and public HTTPS image URLs alongside three clearly labeled sample demos. Source assets are in `web/`; `worker/api.js` handles recognition, solving, and a separate model check. `scripts/build-worker.mjs` embeds the assets into a dependency-free Worker at `dist/server/index.js`. Photos are sent to OpenAI only when the user chooses Read equation. Recognition must be reviewed before solving. Google Fonts is used for typography.

## Live mode

Use a server endpoint with a server-held `OPENAI_API_KEY`. The browser sends an image to a transcription request using the Responses API `input_image` data URL format. Return an equation and ambiguity notes. Require user review before a second request generates a structured solution. A separate request checks the solution against the confirmed equation, flags uncertainty, and returns substitution details. Model checking is not a proof of correctness. Do not silently replace a failed live request with a sample result.

Apply file validation, request limits, timeouts, structured response validation, and authenticated access before enabling live mode. Keep secrets out of browser code. Configure a supported vision model as a runtime setting.

Official reference: https://developers.openai.com/api/docs/guides/images-vision
