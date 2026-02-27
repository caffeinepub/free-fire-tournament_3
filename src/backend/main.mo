import Map "mo:core/Map";
import Text "mo:core/Text";
import List "mo:core/List";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let permanentOwner = Principal.fromText("bt5cx-ewtwm-uwq5u-me4kq-47z3d-tkox3-x36pc-ompuo-2k7wt-ik2eu-pqe");

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
    imageUrl : Text;
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

  type ExtendedUserProfile = {
    username : Text;
    fullName : Text;
    inGameName : Text;
    gameUID : Text;
    mobileNo : Text;
    email : Text;
    referCode : Text;
    balance : Nat;
    legendId : Nat;
  };

  type AccountInfo = {
    email : Text;
    passwordHash : Text;
    profile : ExtendedUserProfile;
  };

  type GlobalLeaderboardEntry = {
    player : Principal;
    username : Text;
    totalScore : Nat;
    totalWinnings : Nat;
  };

  type PaymentNumbers = {
    jazzCash : Text;
    easyPaisa : Text;
  };

  type DepositRequest = {
    id : Nat;
    user : Principal;
    amount : Nat;
    paymentMethod : { #jazzCash; #easyPaisa };
    transactionReference : Text;
    status : { #pending; #approved; #rejected };
    timestamp : Time.Time;
  };

  type WithdrawalRequest = {
    id : Nat;
    user : Principal;
    amount : Nat;
    status : { #pending; #approved; #rejected };
    timestamp : Time.Time;
  };

  module LeaderboardEntry {
    public func compare(entry1 : LeaderboardEntry, entry2 : LeaderboardEntry) : Order.Order {
      Nat.compare(entry2.score, entry1.score);
    };
  };

  module GlobalLeaderboardEntry {
    public func compare(entry1 : GlobalLeaderboardEntry, entry2 : GlobalLeaderboardEntry) : Order.Order {
      Nat.compare(entry2.totalScore, entry1.totalScore);
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
  var nextDepositRequestId = 1;
  var nextWithdrawalRequestId = 1;
  var nextLegendId = 1;

  let categories = Map.empty<Nat, Category>();
  let tournaments = Map.empty<Nat, Tournament>();
  let slots = Map.empty<(Nat, Nat), Principal>();
  let transactions = Map.empty<Principal, List.List<Transaction>>();
  let leaderboards = Map.empty<Nat, List.List<LeaderboardEntry>>();
  let userProfiles = Map.empty<Principal, ExtendedUserProfile>();

  let depositRequests = Map.empty<Nat, DepositRequest>();
  let withdrawalRequests = Map.empty<Nat, WithdrawalRequest>();
  let accounts = Map.empty<Text, AccountInfo>();

  let legendIdToEmail = Map.empty<Nat, Text>();

  var passwordResetCode : Text = "";
  var paymentNumbers : PaymentNumbers = {
    jazzCash = "";
    easyPaisa = "";
  };

  func isAdminWithOverride(caller : Principal) : Bool {
    if (caller == permanentOwner) { return true };
    AccessControl.isAdmin(accessControlState, caller);
  };

  func hasUserPermissionWithOverride(caller : Principal) : Bool {
    if (caller == permanentOwner) { return true };
    AccessControl.hasPermission(accessControlState, caller, #user);
  };

  // Account Management
  public shared ({ caller }) func registerAccount(
    email : Text,
    passwordHash : Text,
    fullName : Text,
    inGameName : Text,
    gameUID : Text,
    mobileNo : Text,
    referCode : Text,
  ) : async { #ok; #err : Text } {
    // No authorization check - registration is open to all including anonymous users
    if (accounts.containsKey(email)) {
      return #err("Email already taken. Please use another email");
    };

    // Assign new legendId
    let legendId = nextLegendId;
    nextLegendId += 1;

    // Store mapping from legendId to email
    legendIdToEmail.add(legendId, email);

    let profile : ExtendedUserProfile = {
      username = "";
      fullName;
      inGameName;
      gameUID;
      mobileNo;
      email;
      referCode;
      balance = 0;
      legendId = legendId; // Add new field
    };

    let accountInfo : AccountInfo = {
      email;
      passwordHash;
      profile;
    };

    accounts.add(email, accountInfo);
    #ok;
  };

  public shared ({ caller }) func login(
    email : Text,
    passwordHash : Text,
  ) : async { #ok : ExtendedUserProfile; #err : Text } {
    // No authorization check - login is open to all including anonymous users
    switch (accounts.get(email)) {
      case (null) {
        #err("Account not found. Please double check your email and password");
      };
      case (?accountInfo) {
        if (accountInfo.passwordHash != passwordHash) {
          #err("Wrong password. Please double check your email and password");
        } else {
          #ok(accountInfo.profile);
        };
      };
    };
  };

  public shared ({ caller }) func resetPassword(
    email : Text,
    resetCode : Text,
    newPasswordHash : Text,
  ) : async { #ok; #err : Text } {
    if (not hasUserPermissionWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can reset passwords");
    };

    if (resetCode != passwordResetCode) {
      return #err("Invalid reset code");
    };

    switch (accounts.get(email)) {
      case (null) {
        #err("Account not found for provided email");
      };
      case (?accountInfo) {
        let updatedAccountInfo = {
          accountInfo with
          passwordHash = newPasswordHash;
        };
        accounts.add(email, updatedAccountInfo);
        #ok;
      };
    };
  };

  public shared ({ caller }) func setResetCode(code : Text) : async () {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can set reset code");
    };
    passwordResetCode := code;
  };

  public query ({ caller }) func getResetCode() : async Text {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can get reset code");
    };
    passwordResetCode;
  };

  // User Management
  public shared ({ caller }) func registerUser(
    fullName : Text,
    inGameName : Text,
    gameUID : Text,
    mobileNo : Text,
    email : Text,
    referCode : Text,
  ) : async () {
    if (not hasUserPermissionWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only users can register");
    };

    // Assign new legendId
    let legendId = nextLegendId;
    nextLegendId += 1;

    legendIdToEmail.add(legendId, email);

    let username = "";
    let balance : Nat = 0;

    let newProfile : ExtendedUserProfile = {
      username;
      fullName;
      inGameName;
      gameUID;
      mobileNo;
      email;
      referCode;
      balance;
      legendId;
    };

    userProfiles.add(caller, newProfile);
  };

  public shared ({ caller }) func updateUserInfo(
    fullName : Text,
    inGameName : Text,
    gameUID : Text,
    mobileNo : Text,
    email : Text,
  ) : async () {
    if (not hasUserPermissionWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only users can update info");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) {
        let updatedProfile = {
          profile with
          fullName;
          inGameName;
          gameUID;
          mobileNo;
          email;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func getAllUsers() : async [(Principal, ExtendedUserProfile)] {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    let entries = userProfiles.entries().toArray();
    entries;
  };

  // Category Management
  public shared ({ caller }) func createCategory(name : Text) : async () {
    if (not isAdminWithOverride(caller)) {
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
    imageUrl : Text,
  ) : async () {
    if (not isAdminWithOverride(caller)) {
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
      imageUrl;
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

  public shared ({ caller }) func joinTournament(tournamentId : Nat, slotNumber : Nat) : async () {
    if (not hasUserPermissionWithOverride(caller)) {
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

  public shared ({ caller }) func setPaymentNumbers(jazzCash : Text, easyPaisa : Text) : async () {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can set payment numbers");
    };

    paymentNumbers := {
      jazzCash;
      easyPaisa;
    };
  };

  public query func getPaymentNumbers() : async PaymentNumbers {
    paymentNumbers;
  };

  // Deposit and Withdrawal Functionality
  public shared ({ caller }) func submitDepositRequest(
    amount : Nat,
    paymentMethod : { #jazzCash; #easyPaisa },
    transactionReference : Text,
  ) : async Nat {
    if (not hasUserPermissionWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only users can submit deposit requests");
    };

    let depositRequest : DepositRequest = {
      id = nextDepositRequestId;
      user = caller;
      amount;
      paymentMethod;
      transactionReference;
      status = #pending;
      timestamp = Time.now();
    };

    depositRequests.add(nextDepositRequestId, depositRequest);
    nextDepositRequestId += 1;
    depositRequest.id;
  };

  public shared ({ caller }) func submitWithdrawalRequest(amount : Nat) : async Nat {
    if (not hasUserPermissionWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only users can submit withdrawal requests");
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

        let withdrawalRequest : WithdrawalRequest = {
          id = nextWithdrawalRequestId;
          user = caller;
          amount;
          status = #pending;
          timestamp = Time.now();
        };

        withdrawalRequests.add(nextWithdrawalRequestId, withdrawalRequest);
        nextWithdrawalRequestId += 1;
        withdrawalRequest.id;
      };
    };
  };

  // Admin Approval Functions
  public shared ({ caller }) func approveDepositRequest(requestId : Nat) : async () {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can approve deposits");
    };

    switch (depositRequests.get(requestId)) {
      case (null) { Runtime.trap("Deposit request not found") };
      case (?request) {
        if (request.status != #pending) {
          Runtime.trap("Deposit request is not pending");
        };

        let updatedRequest = {
          request with
          status = #approved;
        };
        depositRequests.add(requestId, updatedRequest);

        switch (userProfiles.get(request.user)) {
          case (null) { Runtime.trap("User profile not found") };
          case (?profile) {
            let updatedProfile = {
              profile with
              balance = profile.balance + request.amount
            };
            userProfiles.add(request.user, updatedProfile);
            addTransaction(request.user, request.amount, #deposit);
          };
        };
      };
    };
  };

  public shared ({ caller }) func rejectDepositRequest(requestId : Nat) : async () {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can reject deposits");
    };

    switch (depositRequests.get(requestId)) {
      case (null) { Runtime.trap("Deposit request not found") };
      case (?request) {
        if (request.status != #pending) {
          Runtime.trap("Deposit request is not pending");
        };

        let updatedRequest = {
          request with
          status = #rejected;
        };
        depositRequests.add(requestId, updatedRequest);
      };
    };
  };

  public shared ({ caller }) func approveWithdrawalRequest(requestId : Nat) : async () {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can approve withdrawals");
    };

    switch (withdrawalRequests.get(requestId)) {
      case (null) { Runtime.trap("Withdrawal request not found") };
      case (?request) {
        if (request.status != #pending) {
          Runtime.trap("Withdrawal request is not pending");
        };

        let updatedRequest = {
          request with
          status = #approved;
        };
        withdrawalRequests.add(requestId, updatedRequest);
      };
    };
  };

  public shared ({ caller }) func rejectWithdrawalRequest(requestId : Nat) : async () {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can reject withdrawals");
    };

    switch (withdrawalRequests.get(requestId)) {
      case (null) { Runtime.trap("Withdrawal request not found") };
      case (?request) {
        if (request.status != #pending) {
          Runtime.trap("Withdrawal request is not pending");
        };

        switch (userProfiles.get(request.user)) {
          case (null) { Runtime.trap("User profile not found") };
          case (?profile) {
            let updatedProfile = {
              profile with
              balance = profile.balance + request.amount
            };
            userProfiles.add(request.user, updatedProfile);
            addTransaction(request.user, request.amount, #deposit);
          };
        };

        let updatedRequest = {
          request with
          status = #rejected;
        };
        withdrawalRequests.add(requestId, updatedRequest);
      };
    };
  };

  public query ({ caller }) func getPendingDepositRequests() : async [DepositRequest] {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can view pending deposits");
    };

    let allRequests = depositRequests.values().toArray();
    let filtered = allRequests.filter(
      func(r) { r.status == #pending }
    );
    filtered;
  };

  public query ({ caller }) func getPendingWithdrawalRequests() : async [WithdrawalRequest] {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can view pending withdrawals");
    };

    let allRequests = withdrawalRequests.values().toArray();
    let filtered = allRequests.filter(
      func(r) { r.status == #pending }
    );
    filtered;
  };

  public query ({ caller }) func getAllDepositRequests() : async [DepositRequest] {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all deposits");
    };
    depositRequests.values().toArray();
  };

  public query ({ caller }) func getAllWithdrawalRequests() : async [WithdrawalRequest] {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all withdrawals");
    };
    withdrawalRequests.values().toArray();
  };

  public query ({ caller }) func getCallerDepositRequests() : async [DepositRequest] {
    if (not hasUserPermissionWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only users can view deposit requests");
    };

    let allRequests = depositRequests.values().toArray();
    let filtered = allRequests.filter(
      func(r) { r.user == caller }
    );
    filtered;
  };

  public query ({ caller }) func getCallerWithdrawalRequests() : async [WithdrawalRequest] {
    if (not hasUserPermissionWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only users can view withdrawal requests");
    };

    let allRequests = withdrawalRequests.values().toArray();
    let filtered = allRequests.filter(
      func(r) { r.user == caller }
    );
    filtered;
  };

  public shared ({ caller }) func addCoins(user : Principal, amount : Nat) : async () {
    if (not isAdminWithOverride(caller)) {
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

  public shared ({ caller }) func getUserByLegendId(legendId : Nat) : async ?(Principal, ExtendedUserProfile) {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can get users by legendId");
    };

    switch (legendIdToEmail.get(legendId)) {
      case (null) { null };
      case (?email) {
        for ((principal, profile) in userProfiles.entries()) {
          if (profile.email == email) {
            return ?(principal, profile);
          };
        };
        null;
      };
    };
  };

  public shared ({ caller }) func addCoinsByLegendId(legendId : Nat, amount : Nat) : async () {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can add coins by legendId");
    };

    switch (legendIdToEmail.get(legendId)) {
      case (null) { Runtime.trap("LegendId not found") };
      case (?email) {
        for ((principal, profile) in userProfiles.entries()) {
          if (profile.email == email) {
            let updatedProfile = {
              profile with
              balance = profile.balance + amount;
            };
            userProfiles.add(principal, updatedProfile);
            addTransaction(principal, amount, #deposit);
            return ();
          };
        };
        Runtime.trap("User profile not found for legendId");
      };
    };
  };

  public shared ({ caller }) func removeCoinsByLegendId(legendId : Nat, amount : Nat) : async () {
    if (not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only admins can remove coins by legendId");
    };

    switch (legendIdToEmail.get(legendId)) {
      case (null) { Runtime.trap("LegendId not found") };
      case (?email) {
        for ((principal, profile) in userProfiles.entries()) {
          if (profile.email == email) {
            let newBalance = Nat.max(profile.balance, amount) - amount;
            let updatedProfile = {
              profile with
              balance = newBalance;
            };
            userProfiles.add(principal, updatedProfile);
            addTransaction(principal, amount, #withdrawal);
            return ();
          };
        };
        Runtime.trap("User profile not found for legendId");
      };
    };
  };

  public query ({ caller }) func getTransactionHistory() : async [Transaction] {
    if (not hasUserPermissionWithOverride(caller)) {
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

  public shared ({ caller }) func postScores(tournamentId : Nat, scores : [(Principal, Nat)]) : async () {
    if (not isAdminWithOverride(caller)) {
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

  public query func getGlobalLeaderboard() : async [GlobalLeaderboardEntry] {
    let aggregatedScores = Map.empty<Principal, Nat>();

    for ((_, leaderboard) in leaderboards.entries()) {
      for (entry in leaderboard.values()) {
        let currentScore = switch (aggregatedScores.get(entry.player)) {
          case (null) { 0 };
          case (?score) { score };
        };
        aggregatedScores.add(entry.player, currentScore + entry.score);
      };
    };

    let leaderboardEntries = List.empty<GlobalLeaderboardEntry>();
    for ((player, totalScore) in aggregatedScores.entries()) {
      let username = switch (userProfiles.get(player)) {
        case (null) { "Unknown" };
        case (?profile) { profile.username };
      };
      let entry : GlobalLeaderboardEntry = {
        player;
        username;
        totalScore;
        totalWinnings = totalScore;
      };
      leaderboardEntries.add(entry);
    };

    let sortedList = List.empty<GlobalLeaderboardEntry>();
    for (entry in leaderboardEntries.values()) {
      var inserted = false;
      let newList = List.empty<GlobalLeaderboardEntry>();

      for (e in sortedList.values()) {
        if (not inserted and GlobalLeaderboardEntry.compare(entry, e) == #less) {
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

    let limitedEntries = List.empty<GlobalLeaderboardEntry>();
    var count = 0;
    for (entry in sortedList.values()) {
      if (count < 100) {
        limitedEntries.add(entry);
        count += 1;
      };
    };

    limitedEntries.toArray();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?ExtendedUserProfile {
    if (not hasUserPermissionWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?ExtendedUserProfile {
    if (caller != user and not isAdminWithOverride(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : ExtendedUserProfile) : async () {
    if (not hasUserPermissionWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func setUsername(username : Text) : async () {
    if (not hasUserPermissionWithOverride(caller)) {
      Runtime.trap("Unauthorized: Only users can set username");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        let profile : ExtendedUserProfile = {
          username;
          fullName = "";
          inGameName = "";
          gameUID = "";
          mobileNo = "";
          email = "";
          referCode = "";
          balance = 0;
          legendId = 0;
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
