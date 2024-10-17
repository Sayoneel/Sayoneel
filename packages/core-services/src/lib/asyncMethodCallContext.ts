import { tracerActiveSpan } from '@rocket.chat/tracing';

export function traceInstanceMethods<T extends object>(instance: T, ignoreMethods: string[] = []): T {
	const className = instance.constructor.name;

	return new Proxy(instance, {
		get(target: Record<string, any>, prop: string): any {
			if (typeof target[prop] === 'function' && !ignoreMethods.includes(prop)) {
				return new Proxy(target[prop], {
					apply: (target, thisArg, argumentsList): any => {
						if (['doNotMixInclusionAndExclusionFields', 'ensureDefaultFields'].includes(prop)) {
							return Reflect.apply(target, thisArg, argumentsList);
						}

						return tracerActiveSpan(
							`model ${className}.${prop}`,
							{
								attributes: {
									model: className,
									method: prop,
									parameters: JSON.stringify(argumentsList),
								},
							},
							() => {
								return Reflect.apply(target, thisArg, argumentsList);
							},
						);
					},
				});
			}

			return Reflect.get(target, prop);
		},
	}) as T;
}
