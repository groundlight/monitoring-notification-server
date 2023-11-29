# VERSION='';
# re="\"(version)\": \"([^\"]*)\"";

# while read -r l; do
#     if [[ $l =~ $re ]]; then
#         value="${BASH_REMATCH[2]}";
#         VERSION="$value";
#     fi
# done < ./package.json;

# echo $VERSION;

APP_VERSION=$(node -p -e "require('./package.json').version")
echo $APP_VERSION