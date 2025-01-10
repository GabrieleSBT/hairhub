import { Injectable } from "@angular/core";
import { jwtDecode } from "jwt-decode";
import { BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: 'root',
})

export class UserService{
    private loggedIn = new BehaviorSubject<boolean>(false);
    loggedIn$ = this.loggedIn.asObservable();

    constructor(){}

    getUserIdFromToken(): string | null{
        const dC = this.getDecodedToken();
        if(!dC){
            return null;
        }
        console.log("decode token esiste", dC);
        return dC.userId;
     }

     private getDecodedToken(){
        const token = localStorage.getItem('jwtToken'); //serve per leggere il token che è salvato nel local storage
        if(!token){
            return null;
         }
         try{
            const decodedToken = jwtDecode<any>(token);
            console.log(decodedToken);
            return decodedToken;
         }catch(error){
            console.error('error decodingToken',error);
            return null;
         }
        
     }

     setLoggedIn(status:boolean): void {
        this.loggedIn.next(status);
     }

     isLoggedIn(): boolean{
        return this.loggedIn.value;
     }
}