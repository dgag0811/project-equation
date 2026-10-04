# Equation

Read an equation from a photo, review its transcription, and get a step-by-step solution using a multimodal LLM.

[Open the website](https://paper-equation-lab.dgag0811.chatgpt.site/) · [GitHub repository](https://github.com/dgag0811/project-equation)

The hosted website is private and requires ChatGPT sign-in. The source repository is public.

## Features

- Upload a JPG, PNG, or WebP image up to 10 MB, or provide a public HTTPS image URL.
- Read the equation with AI and review or edit it before solving.
- Get a worked solution, assumptions, and substitution checks.
- Run a separate model request to review the proposed solution.
- Copy the solution or explore three curated sample equations without API calls.

## How it works

1. **Capture:** Select an image or enter a direct image URL.
2. **Read:** Click **Read equation from image**. The backend sends the image to the OpenAI Responses API and returns the equation and ambiguity notes.
3. **Review:** Check the transcription and correct any symbols.
4. **Solve:** Click **Show me the solution**. One request generates the solution; another checks it independently.

A complete image-to-solution flow uses three model requests. Solving a typed equation uses two. Sample buttons use curated answers and make no API calls. The default model is `gpt-5.6-sol`; it can be changed with `OPENAI_MODEL`.

Model checks can still make mistakes. Review the transcription, domain restrictions, and answer before relying on a result.

## Project structure

| Path | Purpose |
| --- | --- |
| `web/index.html` | Website layout and content |
| `web/style.css` | Responsive styling |
| `web/app.js` | Image preview, sample demos, and live API interactions |
| `web/samples.js` | Curated sample equations and solutions |
| `worker/api.js` | Transcription, solving, model checking, and input validation |
| `scripts/build-worker.mjs` | Embeds the website and API into a standalone Worker |
| `scripts/check-worker.mjs` | Offline checks using mocked model responses |
| `scripts/live-smoke.mjs` | Live image recognition and solution test |
| `.openai/hosting.json` | Existing Sites project identity and hosting configuration |
| `dist/server/index.js` | Generated Worker; ignored by Git |

The app uses plain HTML, CSS, JavaScript modules, and a dependency-free Worker. No frontend framework or package installation is required.

## Build and check

Use Node.js **22.13.0 or later**. The active Worker build and offline checks use Node built-ins and do not require `npm install`.

```sh
git clone https://github.com/dgag0811/project-equation.git
cd project-equation
node scripts/build-worker.mjs
node scripts/check-worker.mjs
node --check web/app.js
```

Run the build before the checks: the checks inspect the generated Worker as well as the API logic. They cover image URL validation, request validation, transcription, solving, the separate check, and embedded asset responses. They do not call OpenAI or incur API charges.

## Configure live AI

Set these environment values on the server hosting the Worker:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Required secret for OpenAI requests |
| `OPENAI_MODEL` | Optional model override; defaults to `gpt-5.6-sol` |

For the hosted Sites deployment, configure the key as a runtime secret and deploy a saved version to apply it. Never place credentials in browser code or `.openai/hosting.json`.

For the local live test, copy `.env.example` to `.env.local` and configure the key, or supply it through the environment. The test loads `.env.local`; the deployed Worker receives runtime bindings.

`scripts/live-smoke.mjs` takes the path to a PNG equation image:

```sh
node scripts/live-smoke.mjs /path/to/equation.png
```

This test makes real API requests and incurs charges. It reads the image, solves the recognized equation, and reports whether the separate check passed. It uses `OPENAI_MODEL` when configured, otherwise the default model.

## Deployment

The build generates an ES module Worker at `dist/server/index.js`, with a default `fetch(request, env)` export. Website assets are embedded in that module, so no separate asset service is required. The build also copies the hosting manifest to `dist/.openai/hosting.json`.

The current website is published through Sites. Use its source synchronization, packaging, and deployment workflow, retaining the existing project ID for updates. Building locally does not publish the website. A separate deployment should use its own hosting configuration and supply the runtime secrets above.

## Privacy and access

- An uploaded image is previewed locally until you click **Read equation from image**; that action sends it to OpenAI.
- Image URL previews contact the image host. Recognition also sends the URL to OpenAI.
- The app does not persist photos or solutions in a database. API requests use `store: false`; provider data handling still applies.
- `.env.local`, generated output, and local runtime state are excluded from Git.
- Private access is enforced by Sites. The Worker has no standalone authentication or rate-limiting layer; add those before hosting it as an unrestricted public service.

## Troubleshooting

| Issue | What to do |
| --- | --- |
| API credits unavailable | Add credits to the API organization that owns the key. |
| AI connection needs a renewed key | Check whether the runtime key expired or was revoked, then replace the server secret. |
| Request limit reached | Wait and retry; check the project's API limits. |
| Image cannot be read | Crop to one equation and use a sharper image, or upload the file instead of using a URL. |
| Model review flags a problem | Review the transcription and solution; a successful model check is not a proof. |

## References

- [OpenAI image inputs](https://developers.openai.com/api/docs/guides/images-vision)
- [API billing](https://platform.openai.com/settings/organization/billing)
- [API usage](https://platform.openai.com/usage)
