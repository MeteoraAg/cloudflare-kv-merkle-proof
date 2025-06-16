import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { address } from '@solana/addresses';

// CONFIG
dotenv.config();
const FOLDER_TO_SEED = 'merkle_proofs';
let VAULT_ADDRESS = process.env.VAULT_ADDRESS;
const KV_NAMESPACE_ID = process.env.KV_NAMESPACE_ID;
const ACCOUNT_ID = process.env.ACCOUNT_ID;
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY;
// CONFIG END

if (!VAULT_ADDRESS) {
	throw new Error('VAULT_ADDRESS not set');
}

VAULT_ADDRESS = address(VAULT_ADDRESS);

if (!KV_NAMESPACE_ID) {
	throw new Error('KV_NAMESPACE_ID not set');
}

if (!ACCOUNT_ID) {
	throw new Error('ACCOUNT_ID not set');
}

if (!CLOUDFLARE_API_KEY) {
	throw new Error('CLOUDFLARE_API_KEY not set');
}

interface ProofRecord {
	[key: string]: {
		merkle_tree: string;
		amount: number;
		proof: Array<number[]>;
	};
}

interface BodyItem {
	base64: boolean;
	key: string;
	value: string;
}

function chunks<T>(array: T[], size: number): T[][] {
	return Array.apply(0, new Array(Math.ceil(array.length / size))).map((_, index) => array.slice(index * size, (index + 1) * size));
}

async function uploadProof() {
	// 1. Read merkle proof files from the folder
	const proofFolder = fs.readdirSync(FOLDER_TO_SEED);
	const files: ProofRecord[] = [];

	for (const fileName of proofFolder) {
		const path = `./${FOLDER_TO_SEED}/${fileName}`;
		const file = fs.readFileSync(path, 'utf-8');
		const json = JSON.parse(file) as ProofRecord;
		files.push(json);
	}

	// 2. Upload them to KV
	for (const file of files) {
		const proofsArr = Object.entries(file);
		for (const chunk of chunks(proofsArr, 10000)) {
			const items: BodyItem[] = chunk.map(([walletAddress, value]) => ({
				key: `${VAULT_ADDRESS}-${walletAddress}`,
				value: JSON.stringify(value),
				base64: false,
			}));

			await Promise.all(
				chunks(items, 250).map(async (body) => {
					let success = false;
					while (!success) {
						const resp = await fetch(
							`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/bulk`,
							{
								body: JSON.stringify(body),
								headers: {
									Authorization: `Bearer ${CLOUDFLARE_API_KEY}`,
									'Content-Type': 'application/json',
								},
								method: 'PUT',
							}
						).then(async (res) => {
							const text = await res.text();
							console.log({ text });
							return JSON.parse(text) as Promise<{ success: boolean }>;
						});

						if (resp.success) {
							success = true;
						}
					}
				})
			);
		}
	}
}

uploadProof();
