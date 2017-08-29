export enum FieldMaskType {
	Exclude, Include
}

export type FieldMaskFrom<T extends string> = FieldMask<T> | Record<T, any> | T[]

export class FieldMask<K extends string> {
	private _entries: K[] = [];

	constructor(public type =  FieldMaskType.Include) {
	}

	static from<T extends string>(from: FieldMaskFrom<T>): FieldMask<T> {
		if (from instanceof FieldMask) {
			return from;
		} else if (Array.isArray(from)) {
			const mask = new FieldMask<T>();
			mask.add(...from);
			return mask;
		} else {
			let maskType = undefined;
			for (const v of Object.values(from)) {
				if (maskType === undefined)
					maskType = v;
				else if (v != maskType)
					throw new Error('Invalid field mask object');
			}
			if (maskType === undefined)
				maskType = FieldMaskType.Include;
			const mask = new FieldMask<T>(maskType);
			mask.add(...Object.keys(from) as T[]);
			return mask;
		}
	}

	add(...fields: K[]): void {
		for (const f of fields) {
			if (!this._entries.includes(f))
				this._entries.push(f);
		}
	}

	get(): Record<K, 0 | 1> {
		return this._entries.reduce((result, f) => {
			result[f] = this.type;
			return result;
		}, {} as Record<K, 0 | 1>);
	}

	includes(field: K): boolean | undefined {
		switch (this.type) {
			case FieldMaskType.Exclude:
				return !this._entries.includes(field);
			case FieldMaskType.Include:
				return this._entries.includes(field);
		}
	}

	negate(): FieldMask<K> {
		switch (this.type) {
			case FieldMaskType.Exclude:
				const includeMask = new FieldMask<K>(FieldMaskType.Include);
				includeMask.add(...this._entries);
				return includeMask;
			case FieldMaskType.Include:
				const excludeMask = new FieldMask<K>(FieldMaskType.Exclude);
				excludeMask.add(...this._entries);
				return excludeMask;
		}
	}

	join(otherFrom: FieldMaskFrom<K>): FieldMask<K> {
		const other = FieldMask.from<K>(otherFrom);
		switch (this.type) {
			case FieldMaskType.Exclude:
				const excludeMask = new FieldMask<K>(FieldMaskType.Exclude);
				excludeMask.add(...this._entries.filter(f => !other.includes(f)));
				return excludeMask;
			case FieldMaskType.Include:
				const includeMask = new FieldMask<K>(FieldMaskType.Include);
				includeMask.add(...this._entries);
				if (other.type === FieldMaskType.Include)
					includeMask.add(...other._entries);
				return includeMask;
		}
	}

	intersect(otherFrom: FieldMask<K>): FieldMask<K> {
		const other = FieldMask.from(otherFrom);
		switch (this.type) {
			case FieldMaskType.Exclude:
				const excludeMask = new FieldMask<K>(FieldMaskType.Exclude);
				excludeMask.add(...this._entries);
				if (other.type === FieldMaskType.Exclude)
					excludeMask.add(...other._entries);
				return excludeMask;
			case FieldMaskType.Include:
				const includeMask = new FieldMask<K>(FieldMaskType.Include);
				includeMask.add(...this._entries.filter(f => other.includes(f)));
				return includeMask;
		}
	}
}
