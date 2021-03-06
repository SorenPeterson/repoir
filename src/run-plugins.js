// @flow

import type { config, program } from './types.js';
import Ajv from 'ajv';
import { formatAjvError } from './utils';

export default function runPlugins (program: program, config: config): Promise<Array<Object>> {
	return Promise.all(Object.keys(config.loadedPlugins).map(key => {
		if (typeof config.rules[key] === 'undefined') {
			return Promise.resolve({
				plugin: key,
				problems: []
			});
		}

		const plugin = config.loadedPlugins[key];

		if (typeof plugin.schema === 'object') {
			const ajv = new Ajv();

			if (!ajv.validate(plugin.schema, config.rules[key])) {
				return Promise.resolve({
					plugin: key,
					problems: ajv.errors.map(error => {
						return {
							message: formatAjvError(error, program.config)
						};
					})
				});
			}
		}

		return plugin.test(config.rules[key], program)
		.then(problems => {
			return {
				plugin: key,
				problems
			};
		});
	}));
}
