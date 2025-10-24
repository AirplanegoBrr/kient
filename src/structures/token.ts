import type { KientScope } from '../authentication/scopes'
import { flatten, type Flattened } from '../util/flatten'

type TokenDataParams = Omit<Flattened<Token>, 'scopes' | 'isAppToken' | 'isExpired' | 'expiresAt'>

/**
 * Response when generating an authorisation token
 *
 * @group API Structures
 */
export class Token {
	/**
	 * The access token
	 */
	accessToken: string

	/**
	 * The type of token presented
	 */
	tokenType: 'Bearer'

	/**
	 * The refresh token used to get a new access token
	 */
	refreshToken?: string

	/**
	 * The seconds until the access token expires
	 */
	expiresIn: number

	/**
	 * A string of space seperated scopes available to this token
	 */
	scope?: string

	/**
	 * The extact date the access token expires
	 */
	expiresAt: Date

	refreshFunction?: Function

	/** @internal */
	constructor(data: TokenDataParams) {
		this.accessToken = data.accessToken
		this.tokenType = data.tokenType
		this.refreshToken = data.refreshToken
		this.expiresIn = data.expiresIn
		this.scope = data.scope
		this.expiresAt = new Date(new Date().getTime() + ((this.expiresIn - 5) * 1000)) // -5 seconds for some buffer
		this.refreshFunction = data.refreshFunction
	}

	/**
	 * An array of scopes available to this token
	 */
	get scopes() {
		return this.scope ? this.scope.split(' ') as KientScope[] : []
	}
	
	/**
	 * Returns true if the token is an app token type
	 */
	get isAppToken() {
		return !this.scope || !this.refreshToken
	}

	/**
	 * Returns true if the token is expired
	 */
	get isExpired() {
		return Date.now() >= this.expiresAt.getTime();
	}

	/**
	 * Gets new token- will update self to updated token and return new token
	 */
	async getNewToken(): Promise<Token | null> {
		// TODO: If the user passes in a clientID and clientSecret then we can refresh manully here
		if (this.refreshFunction) {
			let newToken = await this.refreshFunction();
			Object.assign(this, newToken);
			return newToken;
		}
		return null;
	}

	toJSON() {
		return flatten(this)
	}
}
