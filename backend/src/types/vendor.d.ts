declare module "bcrypt" {
  export function hash(data: string, saltOrRounds: string | number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
}

declare module "jsonwebtoken" {
  export interface SignOptions {
    expiresIn?: string | number;
  }

  export function sign(
    payload: string | object | Buffer,
    secretOrPrivateKey: string,
    options?: SignOptions,
  ): string;

    export function verify(token: string, arg1: string) {
        throw new Error("Function not implemented.");
    }
}
