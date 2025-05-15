// Helper functions for the deploy scripts.
SOLANA_EIDS = [40168, 30168] //40168 = devnet, 30168 = mainnet

// Throws an error if any of the arguments are falsy or undefined.
function ValidateEnvironmentVariables(args) {
    for (const arg of args) {
      if (!arg) {
        throw new Error('Missing environment variable');
      }
    }
}

function getPeerAddressBytes(address, destinationEid) {
    const EVM_PADDING = "0x000000000000000000000000"
    let peerAddressBytes;
    if (SOLANA_EIDS.includes(destinationEid)) {
        peerAddressBytes = bs58.decode(address) //Solana - PEER_ADDRESS should not be padded
    } else {
      let recipientAddressWithoutPrefix = address
      if (address.startsWith("0x")) {
        recipientAddressWithoutPrefix = address.slice(2)
      }
      peerAddressBytes = EVM_PADDING + recipientAddressWithoutPrefix //EVM - PEER_ADDRESS should be 0 padded to 32 bytes.  E.g. 0x000000000000000000000000<evm_address>
    }
    return peerAddressBytes;
}
  
module.exports = {
    ValidateEnvironmentVariables,
    getPeerAddressBytes
}