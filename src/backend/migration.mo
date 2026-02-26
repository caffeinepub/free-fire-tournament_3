module {
  type OldActor = {
    nextCategoryId : Nat;
    nextTournamentId : Nat;
    nextTransactionId : Nat;
  };

  type NewActor = {
    nextCategoryId : Nat;
    nextTournamentId : Nat;
    nextTransactionId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
