// https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/1ee4021e36b9d0d39b42f5a9ffbccaac43c3a50d/src/lang/helpers.ts

import { moment } from "obsidian";
import en from "./locale/en";
import zhCN from "./locale/zh-cn";

export const localeMap: { [k: string]: Partial<typeof en> } = {
	en,
	"zh-cn": zhCN,
};

const locale = localeMap[moment.locale()];

function interpolate(str: string, params: Record<string, unknown>): string {
	const names: string[] = Object.keys(params);
	const vals: unknown[] = Object.values(params);
	return new Function(...names, `return \`${str}\`;`)(...vals);
}

export function t(
	str: keyof typeof en,
	params?: Record<string, unknown>
): string {
	if (!locale) {
		console.error(`FSR error: Locale ${moment.locale()} not found.`);
	}

	const result = (locale && locale[str]) || en[str];

	if (params) {
		return interpolate(result, params);
	}

	return result;
}
