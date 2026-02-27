import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type OldUserProfile = {
    username : Text;
    balance : Nat;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewUserProfile = {
    username : Text;
    fullName : Text;
    inGameName : Text;
    gameUID : Text;
    mobileNo : Text;
    email : Text;
    referCode : Text;
    balance : Nat;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_p, oldProfile) {
        {
          oldProfile with
          fullName = "";
          inGameName = "";
          gameUID = "";
          mobileNo = "";
          email = "";
          referCode = "";
        };
      }
    );
    { userProfiles = newUserProfiles };
  };
};
