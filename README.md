# Cloudflare KV merkle proof hosting

This is a simple KV merkle proof hosting service used to serve Meteora Alpha Vault merkle proofs permissionlessly by using Cloudflare KV.

## Prerequisite

- Node.js
- A registered cloudflare account

## Steps to deploy the KV worker

### 1. Clone the repo

```
git clone https://github.com/MeteoraAg/cloudflare-kv-merkle-proof
```

### 2. Install dependencies

```
npm install --save-dev
```

### 3. Create a KV namespace in Cloudflare if you don't have one

```
npx wrangler kv namespace create <BINDING_NAME>
```

Example

```
npx wrangler kv namespace create alpha-vault-merkle-proof
```

Then, should should get a response like below

```
🌀 Creating namespace with title "alpha-vault-merkle-proof"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{
  "kv_namespaces": [
    {
      "binding": "alpha_vault_merkle_proof",
      "id": "<namespace_id>"
    }
  ]
}
```

### 4. Bind your Worker to your KV namespace

Copy the output from step 2 and paste it into `wrangler.jsonc` file

Example

```
{
	"$schema": "node_modules/wrangler/config-schema.json",
	"name": "kv-merkle-proof",
	"main": "src/index.ts",
	"compatibility_date": "2025-06-12",
	"observability": {
		"enabled": true
	},
	"kv_namespaces": [
		{
			"binding": "alpha_vault_merkle_proof",
			"id": "<namespace_id>"
		}
	]
}

```

### 5. Sync KV binding Env type

Run

```
 npx wrangler types
```

### 6. Deploy the worker

Run

```
npm run deploy
```

You should get a response like below

```
Total Upload: 51.51 KiB / gzip: 12.41 KiB
Your Worker has access to the following bindings:
Binding                                                              Resource
env.alpha_vault_merkle_proof (<namespace_id>)      					 KV Namespace

Uploaded kv-merkle-proof (4.30 sec)
Deployed kv-merkle-proof triggers (2.97 sec)
  <URL>
Current Version ID: <VERSION_ID>
```

Copy the **worker URL** for creation of `MerkleProofMetadata` account and automatic merkle proof uploading from [meteora-pool-setup](https://github.com/MeteoraAg/meteora-pool-setup/blob/cb85e100124fc55d2e8daa3e56d9829ddca581c0/config/create_dynamic_amm_pool_with_permissioned_with_merkle_proof_vault.json#L26)

## Steps to seed the merkle proof

### 1. Clone the repo

```
git clone https://github.com/MeteoraAg/cloudflare-kv-merkle-proof
```

### 2. Prepare merkle proof

Copy the merkle proof from [meteora-pool-setup](https://github.com/MeteoraAg/meteora-pool-setup/tree/main) after create the vault into [merkle_proofs](./merkle_proofs/) folder

### 3. Prepare env

Update value for [env](./scripts/.env)

### 4. Seed the merkle proof

Run

```
npm run upload-proof
```

## Hosting without using Cloudflare KV

If you wish to serve the merkle proofs without using Cloudflare KV, please make sure you follow the following API specification.

_Note: Make sure cors is enabled on your server_

## API request

| Method | Endpoint                          | Description                                                        | Example                                                                                                                                      | Note                                                                                                                                           |
| ------ | --------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | /{vault_address}/{wallet_address} | Return merkle proof for the given vault address and wallet address | https://worker.meteora.ag/merkle-root-config-proof/FJVRfGznTvNGYHkrk7jWRneAtSyNFabbwgW3tfJDgAQH/5unTfT2kssBuNvHPY6LbJfJpLqEcdMxGYLWHwShaeTLi | The base URL `https://worker.meteora.ag/merkle-root-config-proof` need to be stored in `AlphaVault` contract `MerkleProofMetadata` PDA account |

## API response

| Code | Type             | Schema                                                                            | Example                                                                                                                                                                                                                                |
| ---- | ---------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 200  | application/json | <code> { merkle_root_config: string, max_cap: number, proof: number[][] } </code> | <code>{"merkle_root_config":"6p97ZXYJn76jJqpsjWM8gQUJjx1BPbzVW7g4tpkV27FY","max_cap":50000000000,"proof":[[92,238,252,175,113,225,88,203,116,137,193,239,99,36,202,36,59,188,185,87,44,218,247,74,206,43,106,122,84,65,50,34]]}</code> |
