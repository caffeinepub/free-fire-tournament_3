import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type TournamentStatus = { #upcoming; #active; #completed };

  type Category = {
    id : Nat;
    name : Text;
  };

  type Tournament = {
    id : Nat;
    title : Text;
    categoryId : Nat;
    entryFee : Nat;
    prizePool : Nat;
    totalSlots : Nat;
    rules : Text;
    prizeDistribution : [Nat];
    slotsFilled : Nat;
    status : TournamentStatus;
  };

  type Slot = {
    tournamentId : Nat;
    slotNumber : Nat;
    player : Principal;
  };

  type Transaction = {
    id : Nat;
    user : Principal;
    amount : Nat;
    txnType : { #deposit; #withdrawal; #tournamentEntry };
    timestamp : Time.Time;
  };

  type LeaderboardEntry = {
    tournamentId : Nat;
    player : Principal;
    score : Nat;
  };

  type UserProfile = {
    username : Text;
    balance : Nat;
  };

  module LeaderboardEntry {
    public func compare(entry1 : LeaderboardEntry, entry2 : LeaderboardEntry) : Order.Order {
      Nat.compare(entry2.score, entry1.score);
    };
  };

  module SlotKey {
    public func compare(key1 : (Nat, Nat), key2 : (Nat, Nat)) : Order.Order {
      switch (Nat.compare(key1.0, key2.0)) {
        case (#equal) { Nat.compare(key1.1, key2.1) };
        case (order) { order };
      };
    };
  };

  var nextCategoryId = 1;
  var nextTournamentId = 1;
  var nextTransactionId = 1;

  let categories = Map.empty<Nat, Category>();
  let tournaments = Map.empty<Nat, Tournament>();
  let slots = Map.empty<(Nat, Nat), Principal>();
  let transactions = Map.empty<Principal, List.List<Transaction>>();
  let leaderboards = Map.empty<Nat, List.List<LeaderboardEntry>>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Category Management
  public shared ({ caller }) func createCategory(name : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create categories");
    };

    let category : Category = {
      id = nextCategoryId;
      name;
    };
    categories.add(nextCategoryId, category);
    nextCategoryId += 1;
  };

  public query func getCategories() : async [Category] {
    categories.values().toArray();
  };

  // Tournament Management
  public shared ({ caller }) func createTournament(
    title : Text,
    categoryId : Nat,
    entryFee : Nat,
    prizePool : Nat,
    totalSlots : Nat,
    rules : Text,
    prizeDistribution : [Nat],
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create tournaments");
    };

    let tournament : Tournament = {
      id = nextTournamentId;
      title;
      categoryId;
      entryFee;
      prizePool;
      totalSlots;
      rules;
      prizeDistribution;
      slotsFilled = 0;
      status = #upcoming;
    };

    tournaments.add(nextTournamentId, tournament);
    nextTournamentId += 1;
  };

  public query func getTournaments() : async [Tournament] {
    tournaments.values().toArray();
  };

  public query func getTournament(id : Nat) : async ?Tournament {
    tournaments.get(id);
  };

  // Slot Management - Query only, no direct reservation
  public query func getTakenSlots(tournamentId : Nat) : async [Nat] {
    let slotNumbers = slots.keys().toArray();
    let filtered = slotNumbers.filter(
      func(k) { k.0 == tournamentId }
    );
    let mapped = filtered.map(
      func(k) { k.1 }
    );
    mapped;
  };

  // Wallet Management
  public shared ({ caller }) func addCoins(user : Principal, amount : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add coins");
    };

    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        let updatedProfile = {
          profile with
          balance = profile.balance + amount
        };
        userProfiles.add(user, updatedProfile);
        addTransaction(user, amount, #deposit);
      };
    };
  };

  public shared ({ caller }) func requestWithdrawal(amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request withdrawals");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        if (profile.balance < amount) {
          Runtime.trap("Insufficient balance");
        };

        let updatedProfile = {
          profile with
          balance = profile.balance - amount
        };
        userProfiles.add(caller, updatedProfile);
        addTransaction(caller, amount, #withdrawal);
      };
    };
  };

  public query ({ caller }) func getTransactionHistory() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transaction history");
    };

    switch (transactions.get(caller)) {
      case (null) { [] };
      case (?txnList) { txnList.toArray() };
    };
  };

  func addTransaction(user : Principal, amount : Nat, txnType : { #deposit; #withdrawal; #tournamentEntry }) {
    let transaction : Transaction = {
      id = nextTransactionId;
      user;
      amount;
      txnType;
      timestamp = Time.now();
    };
    nextTransactionId += 1;

    let userTransactions = switch (transactions.get(user)) {
      case (null) { List.empty<Transaction>() };
      case (?existingTransactions) { existingTransactions };
    };
    userTransactions.add(transaction);
    transactions.add(user, userTransactions);
  };

  // Join Tournament
  public shared ({ caller }) func joinTournament(tournamentId : Nat, slotNumber : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join tournaments");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        switch (tournaments.get(tournamentId)) {
          case (null) { Runtime.trap("Tournament not found") };
          case (?tournament) {
            if (profile.balance < tournament.entryFee) {
              Runtime.trap("Insufficient balance");
            };

            if (slotNumber > tournament.totalSlots) {
              Runtime.trap("Invalid slot number");
            };

            if (slotNumber == 0) {
              Runtime.trap("Slot number cannot be 0");
            };

            switch (slots.get((tournamentId, slotNumber))) {
              case (?_) { Runtime.trap("Slot already taken") };
              case (null) {
                slots.add((tournamentId, slotNumber), caller);

                let updatedProfile = {
                  profile with
                  balance = profile.balance - tournament.entryFee
                };
                userProfiles.add(caller, updatedProfile);

                addTransaction(caller, tournament.entryFee, #tournamentEntry);

                let updatedTournament = {
                  tournament with
                  slotsFilled = tournament.slotsFilled + 1
                };
                tournaments.add(tournamentId, updatedTournament);
              };
            };
          };
        };
      };
    };
  };

  // Leaderboard Management
  public shared ({ caller }) func postScores(tournamentId : Nat, scores : [(Principal, Nat)]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can post scores");
    };

    let entries = scores.map(
      func((player, score)) {
        {
          tournamentId;
          player;
          score;
        };
      }
    );
    let entryList = List.fromArray<LeaderboardEntry>(entries);

    // Sort the entryList by score descending
    let sortedList = List.empty<LeaderboardEntry>();
    for (entry in entryList.values()) {
      var inserted = false;
      let newList = List.empty<LeaderboardEntry>();

      for (e in sortedList.values()) {
        if (not inserted and LeaderboardEntry.compare(entry, e) == #less) {
          newList.add(entry);
          inserted := true;
        };
        newList.add(e);
      };

      if (not inserted) {
        newList.add(entry);
      };

      sortedList.clear();
      for (e in newList.values()) {
        sortedList.add(e);
      };
    };

    leaderboards.add(tournamentId, sortedList);
  };

  public query func getLeaderboard(tournamentId : Nat) : async [LeaderboardEntry] {
    switch (leaderboards.get(tournamentId)) {
      case (null) { [] };
      case (?entries) { entries.toArray() };
    };
  };

  // User Profile Management - Following the required interface
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Additional helper for setting username
  public shared ({ caller }) func setUsername(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set username");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        let profile : UserProfile = {
          username;
          balance = 0;
        };
        userProfiles.add(caller, profile);
      };
      case (?existing) {
        let updatedProfile = {
          existing with
          username;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };
};
